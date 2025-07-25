
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
import { Search, MoreHorizontal, FileDown, CheckCircle, Clock, XCircle, DollarSign, Package, TrendingUp, Loader2 } from "lucide-react";
import { DateRangePicker } from "@/components/date-range-picker";
import { collection, query, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";


type Investment = {
  id: string;
  userId: string;
  fundId: string;
  amount: number;
  transactionHash: string;
  status: 'pending' | 'active' | 'completed';
  createdAt: Timestamp;
};

const fundNames = {
    gold: "طلا",
    silver: "نقره",
    dollar: "دلار",
    bitcoin: "بیت‌کوین"
};

const statusNames = {
    pending: "در انتظار تایید",
    active: "فعال",
    completed: "خاتمه یافته",
};


export default function AdminInvestmentsPage() {
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvestments = async () => {
            try {
                const investmentsCollection = collection(db, "investments");
                const q = query(investmentsCollection, orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                const investmentsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Investment[];
                setInvestments(investmentsData);
            } catch (error) {
                console.error("Error fetching investments: ", error);
                // TODO: Add toast notification for error
            } finally {
                setLoading(false);
            }
        };

        fetchInvestments();
    }, []);


  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "completed":
        return <XCircle className="h-4 w-4 text-red-500" />;
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
        return "destructive";
      default:
        return "default";
    }
  };


  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">مدیریت سرمایه‌گذاری‌ها</h1>
      </div>

       <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل مبلغ سرمایه‌گذاری</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">$1,268,750.50</div>
            <p className="text-xs text-muted-foreground">
              +12% در ماه گذشته
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">سرمایه‌گذاری‌های فعال</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,234</div>
            <p className="text-xs text-muted-foreground">
              +502 در ماه گذشته
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">میانگین سرمایه‌گذاری</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">$1,150.75</div>
            <p className="text-xs text-muted-foreground">
              نسبت به ماه گذشته بدون تغییر
            </p>
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
                                placeholder="جستجو بر اساس کاربر یا شناسه..."
                                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
                            />
                        </div>
                        <Button variant="outline">
                           <FileDown className="h-4 w-4 ml-2" />
                            دریافت خروجی
                        </Button>
                    </div>
                </div>
                 <div className="flex flex-col md:flex-row items-center gap-2 mt-4">
                    <Select>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="فیلتر بر اساس صندوق" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">همه صندوق‌ها</SelectItem>
                            <SelectItem value="gold">طلا</SelectItem>
                            <SelectItem value="silver">نقره</SelectItem>
                            <SelectItem value="dollar">دلار</SelectItem>
                            <SelectItem value="bitcoin">بیت‌کوین</SelectItem>
                        </SelectContent>
                    </Select>
                     <Select>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="فیلتر بر اساس وضعیت" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                            <SelectItem value="active">فعال</SelectItem>
                            <SelectItem value="pending">در انتظار تایید</SelectItem>
                            <SelectItem value="finished">خاتمه یافته</SelectItem>
                        </SelectContent>
                    </Select>
                    <DateRangePicker className="w-full md:w-auto" />
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>شناسه کاربر</TableHead>
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
                        ) : investments.length === 0 ? (
                             <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">
                                    هیچ سرمایه‌گذاری‌ای یافت نشد.
                                </TableCell>
                            </TableRow>
                        ) : (
                            investments.map((inv) => (
                                <TableRow key={inv.id}>
                                    <TableCell>
                                        <div className="font-medium truncate" title={inv.userId}>{inv.userId.substring(0, 8)}...</div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">{fundNames[inv.fundId as keyof typeof fundNames]}</TableCell>
                                    <TableCell className="text-right font-mono">
                                        ${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-center">
                                        {inv.createdAt.toDate().toLocaleDateString('fa-IR')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(inv.status)}>
                                        <div className="flex items-center gap-2">
                                                {getStatusIcon(inv.status)}
                                                <span>{statusNames[inv.status as keyof typeof statusNames]}</span>
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
                                                <DropdownMenuItem>مشاهده جزئیات کاربر</DropdownMenuItem>
                                                <DropdownMenuItem>مشاهده تراکنش</DropdownMenuItem>
                                                <DropdownMenuItem>تغییر وضعیت</DropdownMenuItem>
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
                    نمایش <strong>{investments.length}</strong> سرمایه‌گذاری
                </div>
                 {/* Pagination can be added here */}
            </CardFooter>
       </Card>
    </>
  );
}
