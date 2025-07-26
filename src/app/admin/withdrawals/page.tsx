
"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, FileDown, CheckCircle, Clock, XCircle, Ban, Loader2, AlertTriangle, Check, ArrowDownUp, TrendingUp } from "lucide-react";
import { getWithdrawalRequests, WithdrawalRequest } from "@/ai/flows/get-withdrawal-requests-flow";
import { updateWithdrawalStatus } from "@/ai/flows/update-withdrawal-status-flow";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const statusNames: Record<string, string> = {
    pending: "در انتظار",
    approved: "تایید شده",
    rejected: "رد شده",
    completed: "پرداخت شده",
};

export default function AdminWithdrawalsPage() {
    const { toast } = useToast();
    const [allRequests, setAllRequests] = useState<WithdrawalRequest[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<WithdrawalRequest[]>([]);
    const [stats, setStats] = useState({ totalPending: 0, totalApproved: 0, pendingCount: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchRequests = useCallback(() => {
        setLoading(true);
        getWithdrawalRequests()
            .then(data => {
                setAllRequests(data.requests);
                setFilteredRequests(data.requests);
                
                const totalPending = data.requests.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0);
                const totalApproved = data.requests.filter(r => r.status === 'approved' || r.status === 'completed').reduce((sum, r) => sum + r.amount, 0);
                const pendingCount = data.requests.filter(r => r.status === 'pending').length;
                setStats({ totalPending, totalApproved, pendingCount });
            })
            .catch(error => {
                console.error("Error fetching withdrawal requests:", error);
                toast({
                    variant: "destructive",
                    title: "خطا در واکشی اطلاعات",
                    description: "مشکلی در دریافت لیست درخواست‌های برداشت رخ داد.",
                });
            })
            .finally(() => setLoading(false));
    }, [toast]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    useEffect(() => {
        let result = allRequests;
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            result = result.filter(req => 
                req.userFullName.toLowerCase().includes(lowercasedTerm) || 
                req.userEmail.toLowerCase().includes(lowercasedTerm) ||
                req.walletAddress.toLowerCase().includes(lowercasedTerm) ||
                req.id.toLowerCase().includes(lowercasedTerm)
            );
        }
        setFilteredRequests(result);
    }, [searchTerm, allRequests]);

    const handleStatusUpdate = async (withdrawalId: string, newStatus: 'approved' | 'rejected') => {
        try {
            const result = await updateWithdrawalStatus({ withdrawalId, newStatus });
            if (result.success) {
                toast({ title: "عملیات موفق", description: result.message });
                fetchRequests(); // Refresh data
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "خطا در بروزرسانی وضعیت",
                description: error instanceof Error ? error.message : "مشکلی پیش آمد."
            })
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "approved":
            case "completed":
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case "pending":
                return <Clock className="h-4 w-4 text-yellow-500" />;
            case "rejected":
                return <Ban className="h-4 w-4 text-red-500" />;
            default:
                return null;
        }
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case "approved":
            case "completed":
                return "secondary";
            case "pending":
                return "outline";
            case "rejected":
                return "destructive";
            default:
                return "default";
        }
    };

    const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">مدیریت درخواست‌های برداشت</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">مجموع برداشت‌های در انتظار</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold font-mono">{formatCurrency(stats.totalPending)}</div>}
                        <p className="text-xs text-muted-foreground">در {stats.pendingCount} درخواست</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">مجموع برداشت‌های تایید شده</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold font-mono">{formatCurrency(stats.totalApproved)}</div>}
                        <p className="text-xs text-muted-foreground">مجموع تمام برداشت‌های موفق</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex-1 text-right">
                            <CardTitle>لیست درخواست‌های برداشت</CardTitle>
                            <CardDescription>درخواست‌های برداشت وجه کاربران را مشاهده و مدیریت کنید.</CardDescription>
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
                            <div className="relative w-full md:w-auto">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="جستجو کاربر، ایمیل، آدرس..."
                                    className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline"><FileDown className="h-4 w-4 ml-2" />دریافت خروجی</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>کاربر</TableHead>
                                <TableHead className="hidden sm:table-cell">آدرس کیف پول</TableHead>
                                <TableHead className="text-right">مبلغ</TableHead>
                                <TableHead className="text-right hidden md:table-cell">کارمزد</TableHead>
                                <TableHead className="text-right hidden md:table-cell">مبلغ نهایی</TableHead>
                                <TableHead className="hidden sm:table-cell text-center">تاریخ</TableHead>
                                <TableHead>وضعیت</TableHead>
                                <TableHead><span className="sr-only">عملیات</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={8} className="text-center py-10"><Loader2 className="h-5 w-5 animate-spin mx-auto"/></TableCell></TableRow>
                            ) : filteredRequests.length === 0 ? (
                                <TableRow><TableCell colSpan={8} className="text-center py-10">هیچ درخواستی یافت نشد.</TableCell></TableRow>
                            ) : (
                                filteredRequests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell>
                                            <div className="font-medium">{req.userFullName}</div>
                                            <div className="text-xs text-muted-foreground">{req.userEmail}</div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell font-mono text-xs" dir="ltr">{req.walletAddress}</TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(req.amount)}</TableCell>
                                        <TableCell className="text-right font-mono hidden md:table-cell text-red-500">{formatCurrency(req.fee)}</TableCell>
                                        <TableCell className="text-right font-mono hidden md:table-cell text-green-600">{formatCurrency(req.netAmount)}</TableCell>
                                        <TableCell className="hidden sm:table-cell text-center">{req.createdAt}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(req.status)}><div className="flex items-center gap-2">{getStatusIcon(req.status)}<span>{statusNames[req.status]}</span></div></Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Toggle menu</span></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>عملیات</DropdownMenuLabel>
                                                    <DropdownMenuItem asChild><Link href={`/admin/users/${req.userId}`}>مشاهده جزئیات کاربر</Link></DropdownMenuItem>
                                                    {req.status === 'pending' && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-green-600" onClick={() => handleStatusUpdate(req.id, 'approved')}><Check className="ml-2 h-4 w-4" />تایید درخواست</DropdownMenuItem>
                                                            <DropdownMenuItem className="text-red-600" onClick={() => handleStatusUpdate(req.id, 'rejected')}><Ban className="ml-2 h-4 w-4" />رد درخواست</DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter>
                    <div className="text-xs text-muted-foreground">نمایش <strong>{filteredRequests.length}</strong> از <strong>{allRequests.length}</strong> درخواست</div>
                </CardFooter>
            </Card>
        </>
    );
}
