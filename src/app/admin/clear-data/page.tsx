
"use client";

import { useEffect, useState } from "react";
import { clearTestDataAction } from "@/app/actions/platform-settings";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Status = "idle" | "running" | "success" | "error";

export default function ClearDataPage() {
    const { toast } = useToast();
    const [status, setStatus] = useState<Status>("idle");
    const [message, setMessage] = useState("");

    useEffect(() => {
        // This effect runs only once on component mount
        const runCleanup = async () => {
            setStatus("running");
            toast({
                title: "Operation in Progress",
                description: "Clearing all test data. This may take a moment...",
            });

            try {
                const result = await clearTestDataAction();
                if (result.success) {
                    setStatus("success");
                    setMessage(result.message);
                    toast({
                        title: "Success!",
                        description: result.message,
                    });
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
                setStatus("error");
                setMessage(errorMessage);
                toast({
                    variant: "destructive",
                    title: "Error Clearing Data",
                    description: errorMessage,
                });
            }
        };

        runCleanup();
    }, [toast]);

    const StatusDisplay = () => {
        switch (status) {
            case "running":
                return (
                    <>
                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                        <CardTitle>Clearing Test Data...</CardTitle>
                        <CardDescription>
                            Please do not close this window. This process may take a few moments.
                        </CardDescription>
                    </>
                );
            case "success":
                return (
                    <>
                        <CheckCircle className="w-12 h-12 text-green-500" />
                        <CardTitle>Operation Successful</CardTitle>
                        <CardDescription>
                            {message || "All test data has been successfully cleared from the database."}
                        </CardDescription>
                    </>
                );
            case "error":
                return (
                     <>
                        <AlertTriangle className="w-12 h-12 text-destructive" />
                        <CardTitle>An Error Occurred</CardTitle>
                        <CardDescription>
                           {message || "There was a problem clearing the data. Please check the console for more details."}
                        </CardDescription>
                    </>
                )
            default:
                return null;
        }
    }


    return (
        <div className="flex items-center justify-center min-h-full">
            <Card className="w-full max-w-lg">
                <CardHeader>
                     <h1 className="text-lg font-semibold md:text-2xl text-center">Data Cleanup Utility</h1>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center text-center space-y-4 p-8">
                   <StatusDisplay />
                   {status !== 'running' && (
                        <Button asChild className="mt-6">
                            <Link href="/admin/dashboard">Back to Dashboard</Link>
                        </Button>
                   )}
                </CardContent>
            </Card>
        </div>
    );
}
