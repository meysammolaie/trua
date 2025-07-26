
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from 'next/navigation'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, MoreHorizontal, FileDown, CheckCircle, Clock, XCircle, DollarSign, Package, TrendingUp, Loader2, AlertTriangle, Check, Ban } from "lucide-react";
import { DateRangePicker } from "@/components/date-range-picker";
import { getAllTransactions, TransactionWithUser } from "@/ai/flows/get-all-transactions-flow";
import { updateInvestmentStatus } from "@/ai/flows/update-investment-status-flow";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const fundNames: Record<string, string> = {
    gold: "طلا",
    silver: "نقره",
    dollar: "دلار",
    bitcoin: "بیت‌کوین"
};

const statusNames: Record<string, string> = {
    pending: "در انتظار",
    active: "فعال",
    completed: "خاتمه یافته",
    rejected: "رد شده",
};

function AdminInvestmentsPageContent() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const [allInvestments, setAllInvestments] = useState<TransactionWithUser[]>([]);
    const [filteredInvestments, setFilteredInvestments] = useState<TransactionWithUser[]>([]);
    const [stats, setStats] = useState({ totalAmount: 0, pendingCount: 0, averageAmount: 0 });
    const [loading, setLoading] = useState(true);
    
    // Filters state
    const [searchTerm, setSearchTerm] = useState("");
    const [fundFilter, setFundFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        const searchFromUrl = searchParams.get('search');
        if (searchFromUrl) {
            setSearchTerm(searchFromUrl);
        }
    }, [searchParams]);

    const fetchInvestments = useCallback(() => {
        setLoading(true);
        getAllTransactions()
            .then(data => {
                const investmentsOnly = data.transactions.filter(t => t.type === 'investment');
                setAllInvestments(investmentsOnly);
                
                const activeInvestments = investmentsOnly.filter(inv => inv.status === 'active');
                const totalAmount = activeInvestments.reduce((sum, inv) => sum + Math.abs(inv.amount), 0);
                const pendingCount = investmentsOnly.filter(inv => inv.status === 'pending').length;
                const averageAmount = activeInvestments.length > 0 ? totalAmount / activeInvestments.length : 0;
                setStats({ totalAmount, pendingCount, averageAmount });
            })
            .catch(error => {
                console.error("Error fetching investments:", error);
                toast({
                    variant: "destructive",
                    title: "خطا در واکشی اطلاعات",
                    description: "مشکلی در دریافت لیست سرمایه‌گذاری‌ها رخ داد.",
                });
            })
            .finally(() => setLoading(false));
    }, [toast]);

    useEffect(() => {
        fetchInvestments();
    }, [fetchInvestments]);

    useEffect(() => {
        let result = allInvestments;

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            result = result.filter(inv => 
                inv.userFullName.toLowerCase().includes(lowercasedTerm) || 
                inv.userEmail.toLowerCase().includes(lowercasedTerm) ||
                inv.id.toLowerCase().includes(lowercasedTerm)
            );
        }

        if (fundFilter !== "all") {
            result = result.filter(inv => inv.fundId === fundFilter);
        }
        
        if (statusFilter !== "all") {
            result = result.filter(inv => inv.status === statusFilter);
        }

        setFilteredInvestments(result);
    }, [searchTerm, fundFilter, statusFilter, allInvestments]);


    const handleStatusUpdate = async (investmentId: string, newStatus: 'active' | 'rejected') => {
        try {
            const result = await updateInvestmentStatus({ investmentId, newStatus });
            if (result.success) {
                toast({
                    title: "عملیات موفق",
                    description: result.message,
                });
                fetchInvestments(); // Refresh data
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
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "rejected":
          return <Ban className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "secondary";
      case "pending":
        return "outline";
      case "completed":
        return "default";
      case "rejected":
          return "destructive";
      default:
        return "default";
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }


  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">مدیریت سرمایه‌گذاری‌ها</h1>
      </div>

       <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل مبلغ سرمایه‌گذاری فعال</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : (
                <div className="text-2xl font-bold font-mono">{formatCurrency(stats.totalAmount)}</div>
            )}
            <p className="text-xs text-muted-foreground">مجموع تمام سرمایه‌گذاری‌های تایید شده</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">درخواست‌های در انتظار</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : (
                <div className="text-2xl font-bold">{stats.pendingCount.toLocaleString()}</div>
             )}
            <p className="text-xs text-muted-foreground">نیاز به تایید یا رد توسط مدیر</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">میانگین سرمایه‌گذاری</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : (
                <div className="text-2xl font-bold font-mono">{formatCurrency(stats.averageAmount)}</div>
             )}
            <p className="text-xs text-muted-foreground">میانگین مبلغ سرمایه‌گذاری‌های فعال</p>
          </CardContent>
        </Card>
      </div>

       <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex-1 text-right">
                        <CardTitle>لیست سرمایه‌گذاری‌ها</CardTitle>
                        <CardDescription>
                            تمام سرمایه‌گذاری‌های ثبت‌شده در پلتفرم را مشاهده و مدیریت کنید.
                        </CardDescription>
                    </div>
                     <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-auto">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="جستجو کاربر، ایمیل، شناسه..."
                                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline">
                           <FileDown className="h-4 w-4 ml-2" />
                            دریافت خروجی
                        </Button>
                    </div>
                </div>
                 <div className="flex flex-col md:flex-row items-center gap-2 mt-4">
                    <Select value={fundFilter} onValueChange={setFundFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="فیلتر بر اساس صندوق" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">همه صندوق‌ها</SelectItem>
                            <SelectItem value="gold">طلا</SelectItem>
                            <SelectItem value="silver">نقره</SelectItem>
                            <SelectItem value="usdt">تتر</SelectItem>
                            <SelectItem value="bitcoin">بیت‌کوین</SelectItem>
                        </SelectContent>
                    </Select>
                     <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="فیلتر بر اساس وضعیت" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                            <SelectItem value="pending">در انتظار</SelectItem>
                            <SelectItem value="active">فعال</SelectItem>
                            <SelectItem value="completed">خاتمه یافته</SelectItem>
                            <SelectItem value="rejected">رد شده</SelectItem>
                        </SelectContent>
                    </Select>
                    <DateRangePicker className="w-full md:w-auto" />
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>کاربر</TableHead>
                            <TableHead className="hidden md:table-cell">صندوق</TableHead>
                             <TableHead className="text-right">مبلغ</TableHead>
                            <TableHead className="hidden md:table-cell text-center">تاریخ</TableHead>
                            <TableHead>وضعیت</TableHead>
                            <TableHead>
                                <span className="sr-only">عملیات</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">
                                    <div className="flex justify-center items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin"/>
                                        <span>در حال بارگذاری سرمایه‌گذاری‌ها...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredInvestments.length === 0 ? (
                             <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">
                                    هیچ سرمایه‌گذاری‌ای با این فیلترها یافت نشد.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredInvestments.map((inv) => (
                                <TableRow key={inv.id}>
                                    <TableCell>
                                        <div className="font-medium">{inv.userFullName}</div>
                                        <div className="text-xs text-muted-foreground">{inv.userEmail}</div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">{fundNames[inv.fundId] || inv.fundId}</TableCell>
                                    <TableCell className="text-right font-mono">
                                        {formatCurrency(inv.amount)}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-center">
                                        {inv.createdAt}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(inv.status!)}>
                                        <div className="flex items-center gap-2">
                                                {getStatusIcon(inv.status!)}
                                                <span>{statusNames[inv.status!] || inv.status}</span>
                                        </div>
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Toggle menu</span>
                                            </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>عملیات</DropdownMenuLabel>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/users/${inv.userId}`}>مشاهده جزئیات کاربر</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem disabled>مشاهده تراکنش بلاکچین</DropdownMenuItem>
                                                {inv.status === 'pending' && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-green-600" onClick={() => handleStatusUpdate(inv.originalInvestmentId, 'active')}>
                                                            <Check className="ml-2 h-4 w-4" />
                                                            تایید سرمایه‌گذاری
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-600" onClick={() => handleStatusUpdate(inv.originalInvestmentId, 'rejected')}>
                                                            <Ban className="ml-2 h-4 w-4" />
                                                            رد سرمایه‌گذاری
                                                        </DropdownMenuItem>
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
                <div className="text-xs text-muted-foreground">
                    نمایش <strong>{filteredInvestments.length}</strong> از <strong>{allInvestments.length}</strong> سرمایه‌گذاری
                </div>
            </CardFooter>
       </Card>
    </>
  );
}

// This is a wrapper component because hooks like useSearchParams can only be used in client components
// that are children of a <Suspense> boundary.
export default function AdminInvestmentsPage() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <AdminInvestmentsPageContent />
        </React.Suspense>
    )
}
