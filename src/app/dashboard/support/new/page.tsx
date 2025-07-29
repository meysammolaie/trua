
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { createTicketAction } from "@/app/actions/support";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";

const ticketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters."),
  department: z.enum(['technical', 'financial', 'general'], {
    required_error: "Please select a department.",
  }),
  priority: z.enum(['low', 'medium', 'high'], {
    required_error: "Please select a priority.",
  }),
  message: z.string().min(10, "Message must be at least 10 characters."),
});

export default function NewTicketPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    
    const form = useForm<z.infer<typeof ticketSchema>>({
        resolver: zodResolver(ticketSchema),
        defaultValues: {
            subject: "",
            department: "general",
            priority: "medium",
            message: "",
        },
    });
    
    const { isSubmitting } = form.formState;

    async function onSubmit(values: z.infer<typeof ticketSchema>) {
        if (!user) {
            toast({ variant: "destructive", title: "Error", description: "You must be logged in to create a ticket." });
            return;
        }

        try {
            const result = await createTicketAction({ userId: user.uid, ...values });
            if (result.success && result.ticketId) {
                toast({ title: "Success", description: "Your ticket has been submitted successfully." });
                router.push(`/dashboard/support/${result.ticketId}`);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error Creating Ticket",
                description: error instanceof Error ? error.message : "An error occurred.",
            });
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Create New Ticket</CardTitle>
                        <CardDescription>Share your problem or question with the support team.</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Subject</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Problem with withdrawal" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                        <div className="grid md:grid-cols-2 gap-6">
                            <FormField
                            control={form.control}
                            name="department"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Department</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select a department" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="general">General</SelectItem>
                                        <SelectItem value="financial">Financial</SelectItem>
                                        <SelectItem value="technical">Technical</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                             <FormField
                            control={form.control}
                            name="priority"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Priority</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="Select a priority" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </div>
                        <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Your Message</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Describe your issue in detail..." className="min-h-[150px]" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                         <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Ticket
                        </Button>
                    </form>
                 </Form>
            </CardContent>
        </Card>
    )
}
