
"use client";

import { useState, useEffect } from "react";
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
import { Loader2, ArrowUpRight, DollarSign, Ticket, UserX, UserCheck, ArrowRight } from "lucide-react";
import { GetUserDetailsOutput, getUserDetails } from "@/ai/flows/get-user-details-flow";
import { useToast } from "@/hooks/use-toast";
import { updateUserStatus } from "@/ai/flows/update-user-status-flow";
import Link from "next/link";

type UserDetails = GetUserDetailsOutput;

export default function AdminUserDetailPage({ params }: { params: { userId: string } }) {
    const [details, setDetails] = useState<UserDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { userId } = params;

    const fetchUserDetails = async (id: string) => {
        try {
            setLoading(true);
            const data = await getUserDetails({ userId: id });
            setDetails(data);
        } catch (error) {
            console.error("Error fetching user details:", error);
            toast({
                variant: "destructive",
                title: "خطا در واکشی اطلاعات کاربر",
                description: error instanceof Error ? error.message : "مشکلی در دریافت اطلاعات کاربر رخ داد.",
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
        const actionText = newStatus === 'active' ? 'فعال' : 'مسدود';
        try {
            const result = await updateUserStatus({ userId: userId, newStatus: newStatus });
            if (result.success) {
                toast({
                    title: `کاربر ${actionText} شد`,
                    description: result.message,
                });
                await fetchUserDetails(userId); // Refresh details
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
             toast({
                variant: "destructive",
                title: `خطا در ${actionText} کردن کاربر`,
                description: error instanceof Error ? error.message : "یک خطای ناشناخته رخ داد.",
            });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="mr-4">در حال بارگذاری اطلاعات کاربر...</p>
            </div>
        )
    }

    if (!details) {
        return (
             <div className="flex justify-center items-center h-full">
                <p>اطلاعات کاربری یافت نشد.</p>
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
                            <ArrowRight className="ml-2 h-4 w-4" />
                            بازگشت به لیست
                        </Link>
                    </Button>
                    <h1 className="text-lg font-semibold md:text-2xl">جزئیات کاربر</h1>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                 <Card className="col-span-1 lg:col-span-2">
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
                                    {profile.status === 'active' ? 'فعال' : 'مسدود شده'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">عضویت از {profile.createdAt}</span>
                            </div>
                        </div>
                    </CardHeader>
                     <CardFooter>
                         <Button 
                            variant={profile.status === 'active' ? 'destructive' : 'secondary'}
                            onClick={handleToggleStatus}
                        >
                            {profile.status === 'active' ? <UserX className="ml-2 h-4 w-4" /> : <UserCheck className="ml-2 h-4 w-4" />}
                            {profile.status === 'active' ? 'مسدود کردن کاربر' : 'فعال کردن کاربر'}
                         </Button>
                    </CardFooter>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">کل سرمایه‌گذاری</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">${stats.totalInvestment.toLocaleString('en-US')}</div>
                        <p className="text-xs text-muted-foreground">مجموع سرمایه‌گذاری‌های فعال</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">تیکت‌های قرعه‌کشی</CardTitle>
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.lotteryTickets.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">برای قرعه‌کشی این دوره</p>
                    </CardContent>
                </Card>
            </div>
            
             <Card className="mt-6">
                <CardHeader>
                    <CardTitle>تاریخچه سرمایه‌گذاری‌ها</CardTitle>
                    <CardDescription>
                        لیست تمام سرمایه‌گذاری‌های ثبت‌شده توسط این کاربر.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>شناسه</TableHead>
                                <TableHead>صندوق</TableHead>
                                <TableHead>تاریخ</TableHead>
                                <TableHead>وضعیت</TableHead>
                                <TableHead className="text-right">مبلغ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                           {transactions.length === 0 ? (
                             <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                    این کاربر هنوز هیچ سرمایه‌گذاری ثبت نکرده است.
                                </TableCell>
                            </TableRow>
                           ) : (
                             transactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell className="font-mono">{tx.id.substring(0, 8)}...</TableCell>
                                    <TableCell>{tx.fund}</TableCell>
                                    <TableCell>{tx.date}</TableCell>
                                    <TableCell>
                                        <Badge variant={tx.status === 'فعال' ? 'secondary' : 'outline'}>{tx.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-red-500">
                                        ${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
