
"use client";

import * as React from "react";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { DateRangePicker } from "@/components/date-range-picker";
import { Download, ListFilter, Search, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getUserTransactions } from "@/ai/flows/get-user-transactions-flow";

type Transaction = {
    id: string;
    type: string;
    fund: string;
    status: string;
    date: string;
    amount: number;
};


export default function ReportsPage() {
    const { user } = useAuth();
    const [transactions, setTransactions] = React.useState<Transaction[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (user) {
            setLoading(true);
            getUserTransactions({ userId: user.uid })
                .then(response => {
                    setTransactions(response.transactions);
                })
                .catch(error => {
                    console.error("Failed to fetch transactions:", error);
                    // Optionally set an error state and show a toast
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [user]);


  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">گزارش‌ها</h1>
      </div>
       <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>مجموع واریز</CardDescription>
            <CardTitle className="text-4xl font-mono">$0.00</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              +0% نسبت به ماه گذشته
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>مجموع برداشت</CardDescription>
            <CardTitle className="text-4xl font-mono">$0.00</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              +0% نسبت به ماه گذشته
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>سود خالص</CardDescription>
            <CardTitle className="text-4xl font-mono">$0.00</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              +0% نسبت به ماه گذشته
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>تیکت‌های قرعه‌کشی</CardDescription>
            <CardTitle className="text-4xl">0</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              +۰ تیکت در این ماه
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
              {loading ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                        <div className="flex justify-center items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin"/>
                            <span>در حال بارگذاری تراکنش‌ها...</span>
                        </div>
                    </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                        هیچ تراکنشی یافت نشد.
                    </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                    <TableRow key={tx.id}>
                    <TableCell className="font-mono" title={tx.id}>{tx.id.substring(0, 8)}...</TableCell>
                    <TableCell className="font-medium">{tx.type}</TableCell>
                    <TableCell>{tx.fund}</TableCell>
                    <TableCell>
                        <Badge variant={tx.status === 'فعال' ? 'secondary' : tx.status === 'در انتظار' ? 'outline' : 'destructive'}>
                        {tx.status}
                        </Badge>
                    </TableCell>
                    <TableCell>{tx.date}</TableCell>
                    <TableCell className={`text-right font-mono ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter className="flex justify-between items-center border-t pt-4">
             <div className="text-xs text-muted-foreground">
                نمایش <strong>{transactions.length}</strong> تراکنش
             </div>
             <Button variant="outline" disabled={transactions.length === 0}>بارگذاری بیشتر</Button>
        </CardFooter>
      </Card>
    </>
  );
}

