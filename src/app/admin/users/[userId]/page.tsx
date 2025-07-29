
"use client";

import { useState, useEffect } from "react";
import { useParams } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, ArrowUpRight, DollarSign, Ticket, UserX, UserCheck, ArrowLeft, Wallet, TrendingUp } from "lucide-react";
import { GetUserDetailsOutput } from "@/ai/flows/get-user-details-flow";
import { getUserDetailsAction } from "@/app/actions/user-details";
import { updateUserStatusAction } from "@/app/actions/user-status";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

type UserDetails = GetUserDetailsOutput;

const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;


export default function AdminUserDetailPage() {
    const [details, setDetails] = useState<UserDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const params = useParams();
    const userId = params.userId as string;

    const fetchUserDetails = async (id: string) => {
        try {
            setLoading(true);
            const data = await getUserDetailsAction({ userId: id });
            setDetails(data);
        } catch (error) {
            console.error("Error fetching user details:", error);
            toast({
                variant: "destructive",
                title: "Error fetching user details",
                description: error instanceof Error ? error.message : "An error occurred while fetching user data.",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchUserDetails(userId);
        }
    }, [userId]);

    const handleToggleStatus = async () => {
        if (!details) return;

        const newStatus = details.profile.status === 'active' ? 'blocked' : 'active';
        const actionText = newStatus === 'active' ? 'unblock' : 'block';
        try {
            const result = await updateUserStatusAction({ userId: userId, newStatus: newStatus });
            if (result.success) {
                toast({
                    title: `User ${actionText}ed`,
                    description: result.message,
                });
                await fetchUserDetails(userId); // Refresh details
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
             toast({
                variant: "destructive",
                title: `Error ${actionText}ing user`,
                description: error instanceof Error ? error.message : "An unknown error occurred.",
            });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="ml-4">Loading user details...</p>
            </div>
        )
    }

    if (!details) {
        return (
             <div className="flex justify-center items-center h-full">
                <p>User details not found.</p>
             </div>
        )
    }
    
    const { profile, stats, transactions } = details;

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                     <Button variant="outline" asChild>
                        <Link href="/admin/users">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to List
                        </Link>
                    </Button>
                    <h1 className="text-lg font-semibold md:text-2xl">User Details</h1>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                 <Card className="lg:col-span-1">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={`https://i.pravatar.cc/80?u=${profile.uid}`} />
                            <AvatarFallback>{profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                            <CardTitle className="text-2xl">{profile.firstName} {profile.lastName}</CardTitle>
                            <CardDescription>{profile.email}</CardDescription>
                            <div className="flex items-center gap-2 pt-1">
                                <Badge variant={profile.status === 'active' ? 'secondary' : 'destructive'}>
                                    {profile.status === 'active' ? 'Active' : 'Blocked'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">Member since {profile.createdAt}</span>
                            </div>
                        </div>
                    </CardHeader>
                     <CardFooter>
                         <Button 
                            variant={profile.status === 'active' ? 'destructive' : 'secondary'}
                            onClick={handleToggleStatus}
                        >
                            {profile.status === 'active' ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                            {profile.status === 'active' ? 'Block User' : 'Unblock User'}
                         </Button>
                    </CardFooter>
                </Card>
                <Card className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
                    <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted">
                        <DollarSign className="h-6 w-6 text-muted-foreground mb-2"/>
                        <p className="text-xs text-muted-foreground">Active Investment (Net)</p>
                        <p className="font-bold font-mono text-lg">{formatCurrency(stats.activeInvestment)}</p>
                    </div>
                     <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted">
                        <TrendingUp className="h-6 w-6 text-muted-foreground mb-2"/>
                        <p className="text-xs text-muted-foreground">Total Profit</p>
                        <p className="font-bold font-mono text-lg">{formatCurrency(stats.totalProfit)}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted">
                        <Wallet className="h-6 w-6 text-muted-foreground mb-2"/>
                        <p className="text-xs text-muted-foreground">Wallet Balance</p>
                        <p className="font-bold font-mono text-lg">{formatCurrency(stats.walletBalance)}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted">
                        <Ticket className="h-6 w-6 text-muted-foreground mb-2"/>
                        <p className="text-xs text-muted-foreground">Lottery Tickets</p>
                        <p className="font-bold font-mono text-lg">{stats.lotteryTickets.toLocaleString()}</p>
                    </div>
                </Card>
            </div>
            
             <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>
                        A list of all financial activities recorded by this user.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Fund/Details</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                           {transactions.length === 0 ? (
                             <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">
                                    This user has not recorded any transactions yet.
                                </TableCell>
                            </TableRow>
                           ) : (
                             transactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell className="font-mono">{tx.id.substring(0, 8)}...</TableCell>
                                    <TableCell>{tx.type}</TableCell>
                                    <TableCell>{tx.fund}</TableCell>
                                    <TableCell>{tx.date}</TableCell>
                                    <TableCell>
                                        <Badge variant={tx.status === 'Active' ? 'secondary' : tx.status === 'Completed' ? 'default' : 'outline'}>{tx.status}</Badge>
                                    </TableCell>
                                    <TableCell className={`text-right font-mono ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {formatCurrency(tx.amount)}
                                    </TableCell>
                                </TableRow>
                             ))
                           )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    )
}
