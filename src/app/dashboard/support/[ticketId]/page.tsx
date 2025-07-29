
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Send, User, Shield } from "lucide-react";
import { getTicketDetailsAction, addTicketReplyAction } from "@/app/actions/support";
import { GetTicketDetailsOutput } from "@/ai/flows/get-ticket-details-flow";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

type TicketDetails = GetTicketDetailsOutput;

export default function UserTicketDetailPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const ticketId = params.ticketId as string;

    const [details, setDetails] = useState<TicketDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState("");
    const [isReplying, setIsReplying] = useState(false);

    const fetchDetails = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getTicketDetailsAction({ ticketId });
            setDetails(result);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "There was a problem fetching ticket details." });
            router.push('/dashboard/support');
        } finally {
            setLoading(false);
        }
    }, [ticketId, toast, router]);

    useEffect(() => {
        if (ticketId) {
            fetchDetails();
        }
    }, [ticketId, fetchDetails]);

    const handleReply = async () => {
        if (!reply.trim() || !user) return;
        setIsReplying(true);
        try {
            const result = await addTicketReplyAction({ ticketId, senderId: user.uid, message: reply });
            if (result.success) {
                toast({ title: "Success", description: "Your reply has been submitted." });
                setReply("");
                await fetchDetails();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: error instanceof Error ? error.message : "There was a problem submitting your reply." });
        } finally {
            setIsReplying(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    if (!details) {
        return <div className="text-center">Ticket not found.</div>;
    }
    
    // Check if user is authorized to see this ticket
    if (user && details.userId !== user.uid) {
        router.push('/dashboard/support');
        return null;
    }

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                             <CardTitle className="text-2xl">{details.subject}</CardTitle>
                             <CardDescription>
                                Created on {details.createdAt}
                             </CardDescription>
                             <Badge className="mt-2">{details.status}</Badge>
                        </div>
                        <Button variant="outline" onClick={() => router.push('/dashboard/support')}>
                           <ArrowLeft className="mr-2 h-4 w-4" />
                           Back to List
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {details.messages.map(message => (
                            <div key={message.id} className={`flex gap-3 ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                                {message.senderId !== user?.uid && <Shield className="w-8 h-8 p-1.5 rounded-full bg-primary text-primary-foreground" />}
                                <div className={`p-3 rounded-lg max-w-lg ${message.senderId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                                    <p className="text-xs opacity-70 mt-2 text-right">{message.createdAt}</p>
                                </div>
                                 {message.senderId === user?.uid && <User className="w-8 h-8 p-1.5 rounded-full bg-muted" />}
                            </div>
                        ))}
                    </div>
                </CardContent>
                {details.status !== 'closed' && (
                    <CardFooter className="border-t pt-6">
                        <div className="w-full">
                            <h3 className="font-semibold mb-2">Send Reply</h3>
                            <Textarea 
                                placeholder="Write your reply here..." 
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                className="min-h-[100px]"
                            />
                            <Button onClick={handleReply} disabled={isReplying || !reply.trim()} className="mt-2">
                                {isReplying ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                                Send
                            </Button>
                        </div>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
