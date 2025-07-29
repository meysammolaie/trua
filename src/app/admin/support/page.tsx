
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
import { Input } from "@/components/ui/input";
import { Search, ArrowRight, Loader2, Inbox, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAdminTicketsAction } from "@/app/actions/support";
import type { AdminTicket, GetAdminTicketsOutput } from "@/ai/flows/get-admin-tickets-flow";

const statusVariantMap: Record<string, "secondary" | "outline" | "default"> = {
    open: "secondary",
    in_progress: "outline",
    closed: "default"
}

const priorityVariantMap: Record<string, "destructive" | "secondary" | "default"> = {
    high: "destructive",
    medium: "secondary",
    low: "default"
}

export default function AdminSupportPage() {
    const { toast } = useToast();
    const [data, setData] = useState<GetAdminTicketsOutput | null>(null);
    const [filteredTickets, setFilteredTickets] = useState<AdminTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getAdminTicketsAction();
            setData(result);
            setFilteredTickets(result.tickets);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "There was a problem fetching tickets." });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    useEffect(() => {
        if (!data) return;
        const lowercasedTerm = searchTerm.toLowerCase();
        const filtered = data.tickets.filter(ticket => 
            ticket.subject.toLowerCase().includes(lowercasedTerm) ||
            ticket.userFullName.toLowerCase().includes(lowercasedTerm)
        );
        setFilteredTickets(filtered);
    }, [searchTerm, data]);
    
    const stats = data?.stats;

    return (
        <div className="grid gap-6">
             <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                        <Inbox className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{stats?.total.toLocaleString() ?? 0}</div>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold text-yellow-500">{stats?.open.toLocaleString() ?? 0}</div>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{stats?.in_progress.toLocaleString() ?? 0}</div>}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Closed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold text-green-500">{stats?.closed.toLocaleString() ?? 0}</div>}
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Support Center</CardTitle>
                            <CardDescription>
                                Manage and respond to user support tickets.
                            </CardDescription>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search tickets..."
                                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Subject</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Last Updated</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                            ) : filteredTickets.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10">No tickets found.</TableCell></TableRow>
                            ) : (
                                filteredTickets.map((ticket) => (
                                    <TableRow key={ticket.id}>
                                        <TableCell className="font-medium">{ticket.subject}</TableCell>
                                        <TableCell>{ticket.userFullName}</TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariantMap[ticket.status]}>{ticket.status}</Badge>
                                        </TableCell>
                                         <TableCell>
                                            <Badge variant={priorityVariantMap[ticket.priority]}>{ticket.priority}</Badge>
                                        </TableCell>
                                        <TableCell>{ticket.updatedAt}</TableCell>
                                        <TableCell>
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={`/admin/support/${ticket.id}`}>
                                                    View & Reply
                                                    <ArrowRight className="ml-2 h-4 w-4" />
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
