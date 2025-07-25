
"use client";

import * as React from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { DateRangePicker } from "@/components/date-range-picker";
import { Download, ListFilter, Search } from "lucide-react";


const allTransactions = [
    { id: "TXN729", type: "واریز", fund: "دلار", status: "موفق", date: "۱۴۰۳/۰۴/۰۱", amount: 2000.00 },
    { id: "TXN730", type: "برداشت", fund: "کیف پول", status: "در حال انجام", date: "۱۴۰۳/۰۴/۰۲", amount: -500.00 },
    { id: "TXN731", type: "سود روزانه", fund: "طلا", status: "موفق", date: "۱۴۰۳/۰۴/۰۳", amount: 35.70 },
    { id: "INV001", type: "سرمایه‌گذاری", fund: "طلا", status: "موفق", date: "۱۴۰۳/۰۴/۰۳", amount: -1000.00 },
    { id: "TXN733", type: "واریز", fund: "دلار", status: "ناموفق", date: "۱۴۰۳/۰۴/۰۴", amount: 1500.00 },
    { id: "INV002", type: "سرمایه‌گذاری", fund: "بیت‌کوین", status: "موفق", date: "۱۴۰۳/۰۴/۰۵", amount: -5000.00 },
    { id: "WDR001", type: "برداشت سود", fund: "نقره", status: "موفق", date: "۱۴۰۳/۰۴/۰۶", amount: 150.25 },
    { id: "TXN734", type: "سود روزانه", fund: "دلار", status: "موفق", date: "۱۴۰۳/۰۴/۰۷", amount: 12.45 },
    { id: "INV003", type: "خروج از سرمایه", fund: "طلا", status: "موفق", date: "۱۴۰۳/۰۴/۰۸", amount: 980.00 },
    { id: "TXN735", type: "واریز", fund: "بیت‌کوین", status: "موفق", date: "۱۴۰۳/۰۴/۰۹", amount: 3000.00 },
];


export default function ReportsPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">گزارش‌ها</h1>
      </div>
       <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>مجموع واریز</CardDescription>
            <CardTitle className="text-4xl font-mono">$6,500.00</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              +15% نسبت به ماه گذشته
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>مجموع برداشت</CardDescription>
            <CardTitle className="text-4xl font-mono">$500.00</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              +5% نسبت به ماه گذشته
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>سود خالص</CardDescription>
            <CardTitle className="text-4xl font-mono">$1,250.75</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              +30.2% نسبت به ماه گذشته
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>تیکت‌های قرعه‌کشی</CardDescription>
            <CardTitle className="text-4xl">135</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              +40 تیکت در این ماه
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>تاریخچه کامل تراکنش‌ها</CardTitle>
          <CardDescription>
            تمام فعالیت‌های مالی خود را در اینجا مشاهده و مدیریت کنید.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex flex-col md:flex-row items-center gap-4 w-full">
                    <div className="relative w-full md:w-auto">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="جستجو بر اساس شناسه..." className="pl-8 w-full md:w-[200px] lg:w-[300px]" />
                    </div>
                     <Select defaultValue="all-types">
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="نوع تراکنش" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all-types">همه انواع</SelectItem>
                            <SelectItem value="deposit">واریز</SelectItem>
                            <SelectItem value="withdrawal">برداشت</SelectItem>
                            <SelectItem value="profit">سود</SelectItem>
                            <SelectItem value="investment">سرمایه‌گذاری</SelectItem>
                        </SelectContent>
                    </Select>
                    <DateRangePicker className="w-full md:w-auto" />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <Button variant="outline">
                        <Download className="h-4 w-4 ml-2" />
                        دریافت خروجی
                    </Button>
                </div>
            </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>شناسه</TableHead>
                <TableHead>نوع</TableHead>
                <TableHead>صندوق/مقصد</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>تاریخ</TableHead>
                <TableHead className="text-right">مبلغ (دلار)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-mono">{tx.id}</TableCell>
                  <TableCell className="font-medium">{tx.type}</TableCell>
                  <TableCell>{tx.fund}</TableCell>
                  <TableCell>
                    <Badge variant={tx.status === 'موفق' ? 'secondary' : tx.status === 'ناموفق' ? 'destructive' : 'outline'}>
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{tx.date}</TableCell>
                  <TableCell className={`text-right font-mono ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="flex justify-center border-t pt-4">
             {/* Pagination can be added here later */}
             <Button variant="outline">بارگذاری بیشتر</Button>
        </CardFooter>
      </Card>
    </>
  );
}
