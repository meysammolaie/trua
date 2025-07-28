
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
import { Search, FileDown, CheckCircle, Clock, Ban, Loader2, AlertTriangle, Check, DollarSign } from "lucide-react";
import { WithdrawalRequest, GetAllWithdrawalsOutput } from "@/ai/flows/get-withdrawal-requests-flow";
import { getWithdrawalRequestsAction } from "@/app/actions/withdrawals";
import { useToast } from "@/hooks/use-toast";
import { WithdrawalDetailsDialog } from "@/components/admin/withdrawal-details-dialog";
import { DateRangePicker } from "@/components/date-range-picker";
import { DateRange } from "react-day-picker";

const statusNames: Record<string, string> = {
    pending: "در انتظار",
    approved: "تایید شده",
    rejected: "رد شده",
    completed: "پرداخت شده",
};

const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AdminWithdrawalsPage() {
    const { toast } = useToast();
    const [data, setData] = useState<GetAllWithdrawalsOutput | null>(null);
    const [filteredRequests, setFilteredRequests] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const requestsData = await getWithdrawalRequestsAction();
            setData(requestsData);
            setFilteredRequests(requestsData.requests);
        } catch(error) {
            console.error("Error fetching withdrawal requests:", error);
            toast({
                variant: "destructive",
                title: "خطا در واکشی اطلاعات",
                description: "مشکلی در دریافت لیست درخواست‌های برداشت رخ داد.",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    useEffect(() => {
        if (!data) return;
        let result = data.requests;
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            result = result.filter(req => 
                req.userFullName.toLowerCase().includes(lowercasedTerm) || 
                req.userEmail.toLowerCase().includes(lowercasedTerm) ||
                (req.walletAddress && req.walletAddress.toLowerCase().includes(lowercasedTerm)) ||
                req.id.toLowerCase().includes(lowercasedTerm)
            );
        }
        
        if (dateRange?.from && dateRange?.to) {
            result = result.filter(req => {
                const reqDate = new Date(req.createdAt).getTime();
                const toDate = new Date(dateRange.to!);
                toDate.setHours(23, 59, 59, 999);
                return reqDate >= dateRange.from!.getTime() && reqDate <= toDate.getTime();
            });
        }

        setFilteredRequests(result);
    }, [searchTerm, dateRange, data]);

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

    const stats = data?.stats;

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">مدیریت درخواست‌های برداشت</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">موجودی کیف پول پلتفرم</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold font-mono">{formatCurrency(stats?.platformWallet ?? 0)}</div>}
                        <p className="text-xs text-muted-foreground">موجودی دارایی‌های فعال</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">مجموع برداشت‌های در انتظار</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold font-mono">{formatCurrency(stats?.totalPending ?? 0)}</div>}
                        <p className="text-xs text-muted-foreground">در {stats?.pendingCount.toLocaleString() ?? 0} درخواست</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">موجودی پس از برداشت‌ها</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold font-mono">{formatCurrency((stats?.platformWallet ?? 0) - (stats?.totalPending ?? 0))}</div>}
                        <p className="text-xs text-muted-foreground">موجودی پلتفرم با کسر درخواست‌های در انتظار</p>
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
                     <div className="flex flex-col md:flex-row items-center gap-2 mt-4">
                        <DateRangePicker onDateChange={setDateRange} />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>کاربر</TableHead>
                                <TableHead className="text-right">مبلغ درخواستی</TableHead>
                                <TableHead className="text-right hidden md:table-cell">مبلغ نهایی</TableHead>
                                <TableHead className="hidden sm:table-cell text-center">تاریخ</TableHead>
                                <TableHead>وضعیت</TableHead>
                                <TableHead><span className="sr-only">عملیات</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="h-5 w-5 animate-spin mx-auto"/></TableCell></TableRow>
                            ) : filteredRequests.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10">هیچ درخواستی یافت نشد.</TableCell></TableRow>
                            ) : (
                                filteredRequests.map((req) => (
                                    <TableRow key={req.id} className="cursor-pointer" onClick={() => setSelectedRequest(req)}>
                                        <TableCell>
                                            <div className="font-medium">{req.userFullName}</div>
                                            <div className="text-xs text-muted-foreground font-mono" dir="ltr">{req.userEmail}</div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(req.amount)}</TableCell>
                                        <TableCell className="text-right font-mono hidden md:table-cell text-green-600">{formatCurrency(req.netAmount)}</TableCell>
                                        <TableCell className="hidden sm:table-cell text-center">{req.createdAt}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(req.status)}><div className="flex items-center gap-2">{getStatusIcon(req.status)}<span>{statusNames[req.status]}</span></div></Badge>
                                        </TableCell>
                                        <TableCell>
                                             <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedRequest(req)}}>
                                                بررسی
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter>
                    <div className="text-xs text-muted-foreground">نمایش <strong>{filteredRequests.length}</strong> از <strong>{data?.requests.length ?? 0}</strong> درخواست</div>
                </CardFooter>
            </Card>
            
            {selectedRequest && (
                <WithdrawalDetailsDialog
                    request={selectedRequest}
                    open={!!selectedRequest}
                    onOpenChange={(isOpen) => { if (!isOpen) setSelectedRequest(null) }}
                    onStatusChange={fetchRequests}
                />
            )}
        </>
    );
}
