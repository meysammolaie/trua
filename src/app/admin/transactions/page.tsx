
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
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, MoreHorizontal, FileDown, CheckCircle, Clock, XCircle, ArrowRightLeft, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
import { DateRangePicker } from "@/components/date-range-picker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { getAllTransactions, TransactionWithUser } from "@/ai/flows/get-all-transactions-flow";


const typeNames: Record<string, string> = {
    all: "همه انواع",
    deposit: "واریز",
    withdrawal: "برداشت",
    investment: "سرمایه‌گذاری",
    fee: "کارمزد",
    profit: "سود",
};

const statusNames: Record<string, string> = {
    all: "همه وضعیت‌ها",
    pending: "در انتظار",
    active: "فعال",
    completed: "موفق",
    failed: "ناموفق",
};

export default function AdminTransactionsPage() {
    const { toast } = useToast();
    const [allTransactions, setAllTransactions] = useState<TransactionWithUser[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<TransactionWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters state
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        setLoading(true);
        getAllTransactions()
            .then(data => {
                setAllTransactions(data.transactions);
                setFilteredTransactions(data.transactions);
            })
            .catch(error => {
                console.error("Error fetching transactions:", error);
                toast({
                    variant: "destructive",
                    title: "خطا در واکشی اطلاعات",
                    description: "مشکلی در دریافت لیست تراکنش‌ها رخ داد.",
                });
            })
            .finally(() => setLoading(false));
    }, [toast]);

    useEffect(() => {
        let result = allTransactions;

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            result = result.filter(tx => 
                tx.userFullName.toLowerCase().includes(lowercasedTerm) || 
                tx.userEmail.toLowerCase().includes(lowercasedTerm) ||
                tx.id.toLowerCase().includes(lowercasedTerm)
            );
        }

        if (typeFilter !== "all") {
            // Special handling for 'fee' and 'profit' as they are prefixes
            if (typeFilter === 'fee') {
                 result = result.filter(tx => tx.type.startsWith('fee_'));
            } else if (typeFilter === 'profit') {
                 result = result.filter(tx => tx.type.startsWith('profit_'));
            } else {
                 result = result.filter(tx => tx.type === typeFilter);
            }
        }
        
        if (statusFilter !== "all" && statusFilter) {
            result = result.filter(tx => tx.status === statusFilter);
        }

        setFilteredTransactions(result);
    }, [searchTerm, typeFilter, statusFilter, allTransactions]);
    

    const getStatusIcon = (status?: string) => {
        switch (status) {
        case "completed":
        case "active":
            return <CheckCircle className="h-4 w-4 text-green-500" />;
        case "pending":
            return <Clock className="h-4 w-4 text-yellow-500" />;
        case "failed":
            return <XCircle className="h-4 w-4 text-red-500" />;
        default:
            return null;
        }
    };

    const getStatusBadgeVariant = (status?: string) => {
        switch (status) {
        case "completed":
        case "active":
            return "secondary";
        case "pending":
            return "outline";
        case "failed":
            return "destructive";
        default:
            return "default";
        }
    };

    const getTransactionTypeName = (type: string) => {
        if (type.startsWith('fee_')) return 'کارمزد';
        if (type.startsWith('profit_')) return 'سود';
        return typeNames[type] || type;
    }


  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">مدیریت تراکنش‌ها</h1>
      </div>

       <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تعداد کل تراکنش‌ها</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin"/> :
                <div className="text-2xl font-bold">{allTransactions.length.toLocaleString()}</div>
            }
            <p className="text-xs text-muted-foreground">
              تمام رویدادهای مالی و سیستمی
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تراکنش‌های موفق</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loading ? <Loader2 className="h-6 w-6 animate-spin"/> :
                <div className="text-2xl font-bold">{allTransactions.filter(t => ['completed', 'active'].includes(t.status || '')).length.toLocaleString()}</div>
             }
            <p className="text-xs text-muted-foreground">
             تراکنش‌های تکمیل‌شده و فعال
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تراکنش‌های در انتظار</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loading ? <Loader2 className="h-6 w-6 animate-spin"/> :
                <div className="text-2xl font-bold">{allTransactions.filter(t => t.status === 'pending').length.toLocaleString()}</div>
             }
            <p className="text-xs text-muted-foreground">
               نیاز به بررسی و تایید دارد
            </p>
          </CardContent>
        </Card>
      </div>

       <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex-1 text-right">
                        <CardTitle>لیست تمام تراکنش‌ها</CardTitle>
                        <CardDescription>
                            تمام تراکنش‌های مالی ثبت‌شده در پلتفرم را مشاهده و مدیریت کنید.
                        </CardDescription>
                    </div>
                     <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-auto">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="جستجو بر اساس کاربر یا شناسه..."
                                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline">
                           <FileDown className="h-4 w-4 ml-2" />
                            دریافت خروجی
                        </Button>
                    </div>
                </div>
                 <div className="flex flex-col md:flex-row items-center gap-2 mt-4">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="فیلتر بر اساس نوع" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">همه انواع</SelectItem>
                            <SelectItem value="deposit">واریز</SelectItem>
                            <SelectItem value="withdrawal">برداشت</SelectItem>
                             <SelectItem value="investment">سرمایه‌گذاری</SelectItem>
                             <SelectItem value="fee">کارمزد</SelectItem>
                            <SelectItem value="profit">سود</SelectItem>
                        </SelectContent>
                    </Select>
                     <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="فیلتر بر اساس وضعیت" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                            <SelectItem value="active">فعال</SelectItem>
                            <SelectItem value="pending">در انتظار</SelectItem>
                            <SelectItem value="completed">موفق</SelectItem>
                            <SelectItem value="failed">ناموفق</SelectItem>
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
                            <TableHead>شناسه</TableHead>
                            <TableHead className="hidden md:table-cell">نوع</TableHead>
                            <TableHead className="hidden md:table-cell text-center">تاریخ</TableHead>
                            <TableHead>وضعیت</TableHead>
                             <TableHead className="text-right">مبلغ</TableHead>
                            <TableHead>
                                <span className="sr-only">عملیات</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10">
                                    <div className="flex justify-center items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin"/>
                                        <span>در حال بارگذاری تراکنش‌ها...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                         ) : filteredTransactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10">
                                    هیچ تراکنشی با این فیلترها یافت نشد.
                                </TableCell>
                            </TableRow>
                         ) : (
                            filteredTransactions.map((tx) => (
                                <TableRow key={tx.id}>
                                <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="hidden h-9 w-9 sm:flex">
                                                <AvatarImage src={`https://i.pravatar.cc/40?u=${tx.userId}`} alt="Avatar" />
                                                <AvatarFallback>{tx.userFullName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="grid gap-1">
                                                <p className="text-sm font-medium leading-none">{tx.userFullName}</p>
                                                <p className="text-sm text-muted-foreground">{tx.userEmail}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono">{tx.id.substring(0,8)}...</TableCell>
                                    <TableCell className="hidden md:table-cell">{getTransactionTypeName(tx.type)}</TableCell>
                                    <TableCell className="hidden md:table-cell text-center">{tx.createdAt}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(tx.status)}>
                                        <div className="flex items-center gap-2">
                                                {getStatusIcon(tx.status)}
                                                <span>{statusNames[tx.status || 'all'] || tx.status}</span>
                                        </div>
                                        </Badge>
                                    </TableCell>
                                    <TableCell className={`text-right font-mono ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                                <DropdownMenuItem>مشاهده جزئیات تراکنش</DropdownMenuItem>
                                                <DropdownMenuItem>مشاهده پروفایل کاربر</DropdownMenuItem>
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
                    نمایش <strong>{filteredTransactions.length}</strong> از <strong>{allTransactions.length}</strong> تراکنش
                </div>
                 {/* Pagination can be added here */}
            </CardFooter>
       </Card>
    </>
  );
}
