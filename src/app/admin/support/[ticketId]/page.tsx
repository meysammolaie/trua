
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
import { Loader2, ArrowRight, Send, User, Shield } from "lucide-react";
import { getTicketDetailsAction, addTicketReplyAction, updateTicketStatusAction } from "@/app/actions/support";
import { GetTicketDetailsOutput } from "@/ai/flows/get-ticket-details-flow";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TicketDetails = GetTicketDetailsOutput;

export default function AdminTicketDetailPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const ticketId = params.ticketId as string;

    const [details, setDetails] = useState<TicketDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState("");
    const [isReplying, setIsReplying] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const fetchDetails = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getTicketDetailsAction({ ticketId });
            setDetails(result);
        } catch (error) {
            toast({ variant: "destructive", title: "خطا", description: "مشکلی در واکشی جزئیات تیکت رخ داد." });
            router.push('/admin/support');
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
            const result = await addTicketReplyAction({ ticketId, senderId: user.uid, message: reply, isAdminReply: true });
            if (result.success) {
                toast({ title: "موفق", description: "پاسخ شما با موفقیت ثبت شد." });
                setReply("");
                await fetchDetails();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            toast({ variant: "destructive", title: "خطا", description: error instanceof Error ? error.message : "مشکلی در ثبت پاسخ رخ داد." });
        } finally {
            setIsReplying(false);
        }
    };
    
    const handleStatusChange = async (newStatus: "open" | "in_progress" | "closed") => {
        setIsUpdatingStatus(true);
        try {
            const result = await updateTicketStatusAction({ ticketId, newStatus });
             if (result.success) {
                toast({ title: "موفق", description: result.message });
                await fetchDetails();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            toast({ variant: "destructive", title: "خطا", description: error instanceof Error ? error.message : "مشکلی در بروزرسانی وضعیت رخ داد." });
        } finally {
            setIsUpdatingStatus(false);
        }
    }

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    if (!details) {
        return <div className="text-center">تیکت یافت نشد.</div>;
    }

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                             <CardTitle className="text-2xl">{details.subject}</CardTitle>
                             <CardDescription>
                                ارسال شده توسط {details.userFullName} در تاریخ {details.createdAt}
                            </CardDescription>
                        </div>
                        <Button variant="outline" onClick={() => router.push('/admin/support')}>
                           <ArrowRight className="ml-2 h-4 w-4" />
                           بازگشت به لیست
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {details.messages.map(message => (
                            <div key={message.id} className={`flex gap-3 ${message.senderId === details.userId ? 'justify-start' : 'justify-end'}`}>
                                {message.senderId === details.userId && <User className="w-8 h-8 p-1.5 rounded-full bg-muted" />}
                                <div className={`p-3 rounded-lg max-w-lg ${message.senderId === details.userId ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                                    <p className="text-xs opacity-70 mt-2 text-right">{message.createdAt}</p>
                                </div>
                                 {message.senderId !== details.userId && <Shield className="w-8 h-8 p-1.5 rounded-full bg-primary text-primary-foreground" />}
                            </div>
                        ))}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-4 border-t pt-6">
                    <div className="w-full">
                        <h3 className="font-semibold mb-2">ارسال پاسخ</h3>
                        <Textarea 
                            placeholder="پاسخ خود را اینجا بنویسید..." 
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            className="min-h-[100px]"
                        />
                         <Button onClick={handleReply} disabled={isReplying || !reply.trim()} className="mt-2">
                            {isReplying ? <Loader2 className="ml-2 h-4 w-4 animate-spin"/> : <Send className="ml-2 h-4 w-4" />}
                            ارسال
                         </Button>
                    </div>

                    <div className="w-full md:w-1/3">
                        <h3 className="font-semibold mb-2">تغییر وضعیت تیکت</h3>
                        <Select onValueChange={handleStatusChange} value={details.status} disabled={isUpdatingStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="تغییر وضعیت" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="open">باز</SelectItem>
                                <SelectItem value="in_progress">در حال بررسی</SelectItem>
                                <SelectItem value="closed">بسته شده</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
