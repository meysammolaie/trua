
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getUserTicketsAction } from "@/app/actions/support";
import type { Ticket } from "@/ai/flows/get-user-tickets-flow";

const statusVariantMap: Record<string, "secondary" | "outline" | "default"> = {
    open: "secondary",
    in_progress: "outline",
    closed: "default"
}

export default function UserSupportPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTickets = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const result = await getUserTicketsAction({ userId: user.uid });
            setTickets(result);
        } catch (error) {
            toast({ variant: "destructive", title: "خطا", description: "مشکلی در واکشی تیکت‌ها رخ داد." });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);
    
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>مرکز پشتیبانی</CardTitle>
                            <CardDescription>
                                تیکت‌های پشتیبانی خود را مشاهده و مدیریت کنید.
                            </CardDescription>
                        </div>
                        <Button asChild>
                           <Link href="/dashboard/support/new">
                                <PlusCircle className="ml-2 h-4 w-4" />
                                ایجاد تیکت جدید
                           </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>موضوع</TableHead>
                                <TableHead>وضعیت</TableHead>
                                <TableHead>اولویت</TableHead>
                                <TableHead>آخرین بروزرسانی</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                            ) : tickets.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-10">هیچ تیکتی یافت نشد.</TableCell></TableRow>
                            ) : (
                                tickets.map((ticket) => (
                                    <TableRow key={ticket.id}>
                                        <TableCell className="font-medium">{ticket.subject}</TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariantMap[ticket.status]}>{ticket.status}</Badge>
                                        </TableCell>
                                         <TableCell>
                                            <Badge variant={ticket.priority === 'high' ? 'destructive' : 'default'}>{ticket.priority}</Badge>
                                        </TableCell>
                                        <TableCell>{ticket.updatedAt}</TableCell>
                                        <TableCell>
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={`/dashboard/support/${ticket.id}`}>
                                                    مشاهده
                                                    <ArrowRight className="mr-2 h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
