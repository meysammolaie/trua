
"use client";

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
import { Search, MoreHorizontal, FileDown, CheckCircle, Clock, XCircle, ArrowRightLeft, TrendingUp, AlertTriangle } from "lucide-react";
import { DateRangePicker } from "@/components/date-range-picker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


const transactions = [
  { id: "TXN729", user: "علی رضایی", userEmail: "ali.rezaei@example.com", avatar: "/avatars/01.png", type: "واریز", status: "موفق", date: "۱۴۰۳/۰۴/۰۱", amount: 2000.00 },
  { id: "TXN730", user: "مریم حسینی", userEmail: "maryam.hosseini@example.com", avatar: "/avatars/02.png", type: "برداشت", status: "در حال انجام", date: "۱۴۰۳/۰۴/۰۲", amount: -500.00 },
  { id: "TXN731", user: "رضا محمدی", userEmail: "reza.mohammadi@example.com", avatar: "/avatars/03.png", type: "سود روزانه", fund: "طلا", status: "موفق", date: "۱۴۰۳/۰۴/۰۳", amount: 35.70 },
  { id: "INV001", user: "سارا احمدی", userEmail: "sara.ahmadi@example.com", avatar: "/avatars/04.png", type: "سرمایه‌گذاری", fund: "طلا", status: "موفق", date: "۱۴۰۳/۰۴/۰۳", amount: -1000.00 },
  { id: "TXN733", user: "حسین کریمی", userEmail: "hossein.karimi@example.com", avatar: "/avatars/05.png", type: "واریز", status: "ناموفق", date: "۱۴۰۳/۰۴/۰۴", amount: 1500.00 },
  { id: "INV002", user: "علی رضایی", userEmail: "ali.rezaei@example.com", avatar: "/avatars/01.png", type: "سرمایه‌گذاری", fund: "بیت‌کوین", status: "موفق", date: "۱۴۰۳/۰۴/۰۵", amount: -5000.00 },
  { id: "WDR001", user: "مریم حسینی", userEmail: "maryam.hosseini@example.com", avatar: "/avatars/02.png", type: "برداشت سود", fund: "نقره", status: "موفق", date: "۱۴۰۳/۰۴/۰۶", amount: 150.25 },
  { id: "TXN734", user: "رضا محمدی", userEmail: "reza.mohammadi@example.com", avatar: "/avatars/03.png", type: "سود روزانه", fund: "دلار", status: "موفق", date: "۱۴۰۳/۰۴/۰۷", amount: 12.45 },
];

export default function AdminTransactionsPage() {
    const getStatusIcon = (status: string) => {
        switch (status) {
        case "موفق":
            return <CheckCircle className="h-4 w-4 text-green-500" />;
        case "در حال انجام":
            return <Clock className="h-4 w-4 text-yellow-500" />;
        case "ناموفق":
            return <XCircle className="h-4 w-4 text-red-500" />;
        default:
            return null;
        }
    };
    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
        case "موفق":
            return "secondary";
        case "در حال انجام":
            return "outline";
        case "ناموفق":
            return "destructive";
        default:
            return "default";
        }
    };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">مدیریت تراکنش‌ها</h1>
      </div>

       <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حجم کل تراکنش‌ها</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">$3,450,980.20</div>
            <p className="text-xs text-muted-foreground">
              +18.5% در این ماه
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تراکنش‌های موفق</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">54,832</div>
            <p className="text-xs text-muted-foreground">
              ۹۸.۲٪ نرخ موفقیت
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تراکنش‌های در انتظار</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">57</div>
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
                            <SelectValue placeholder="فیلتر بر اساس نوع" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">همه انواع</SelectItem>
                            <SelectItem value="deposit">واریز</SelectItem>
                            <SelectItem value="withdrawal">برداشت</SelectItem>
                             <SelectItem value="investment">سرمایه‌گذاری</SelectItem>
                            <SelectItem value="profit">سود</SelectItem>
                        </SelectContent>
                    </Select>
                     <Select>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="فیلتر بر اساس وضعیت" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                            <SelectItem value="success">موفق</SelectItem>
                            <SelectItem value="pending">در حال انجام</SelectItem>
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
                        {transactions.map((tx) => (
                             <TableRow key={tx.id}>
                               <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="hidden h-9 w-9 sm:flex">
                                            <AvatarImage src={tx.avatar} alt="Avatar" />
                                            <AvatarFallback>{tx.user.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="grid gap-1">
                                            <p className="text-sm font-medium leading-none">{tx.user}</p>
                                            <p className="text-sm text-muted-foreground">{tx.userEmail}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono">{tx.id}</TableCell>
                                <TableCell className="hidden md:table-cell">{tx.type}</TableCell>
                                <TableCell className="hidden md:table-cell text-center">{tx.date}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusBadgeVariant(tx.status)}>
                                       <div className="flex items-center gap-2">
                                            {getStatusIcon(tx.status)}
                                            <span>{tx.status}</span>
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
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
             <CardFooter>
                <div className="text-xs text-muted-foreground">
                    نمایش <strong>۱-۸</strong> از <strong>{transactions.length}</strong> تراکنش
                </div>
                 {/* Pagination can be added here */}
            </CardFooter>
       </Card>
    </>
  );
}

    