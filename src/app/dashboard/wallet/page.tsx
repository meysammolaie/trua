
"use client";

import { Button } from "@/components/ui/button";
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
import { ArrowDownLeft, ArrowUpRight, PlusCircle, MinusCircle, Bitcoin, Crown, DollarSign, Medal } from "lucide-react";

const assetData = [
  { fund: "صندوق دلار", icon: <DollarSign className="w-5 h-5 ml-2 text-green-500" />, amount: 5230.50, value: 5230.50 },
  { fund: "صندوق طلا", icon: <Crown className="w-5 h-5 ml-2 text-yellow-500" />, amount: 10.5, value: 21000.00 },
  { fund: "صندوق نقره", icon: <Medal className="w-5 h-5 ml-2 text-slate-400" />, amount: 100.2, value: 2505.00 },
  { fund: "صندوق بیت‌کوین", icon: <Bitcoin className="w-5 h-5 ml-2 text-orange-500" />, amount: 0.25, value: 16500.75 },
];

const transactionHistory = [
    { id: "TXN729", type: "واریز", status: "موفق", date: "۱۴۰۳/۰۴/۰۱", amount: 2000.00 },
    { id: "TXN730", type: "برداشت", status: "در حال انجام", date: "۱۴۰۳/۰۴/۰۲", amount: -500.00 },
    { id: "TXN731", type: "سود روزانه", status: "موفق", date: "۱۴۰۳/۰۴/۰۳", amount: 35.70 },
    { id: "TXN732", type: "سرمایه‌گذاری در طلا", status: "موفق", date: "۱۴۰۳/۰۴/۰۳", amount: -1000.00 },
    { id: "TXN733", type: "واریز", status: "ناموفق", date: "۱۴۰۳/۰۴/۰۴", amount: 1500.00 },
];


export default function WalletPage() {
    const totalBalance = assetData.reduce((sum, asset) => sum + asset.value, 0);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">کیف پول</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-8">
        {/* Total Balance Card */}
        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle>موجودی کل</CardTitle>
            <CardDescription>مجموع ارزش دارایی‌های شما در کیف پول.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono">${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-2">+۲.۵٪ تغییر در ۲۴ ساعت گذشته</p>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button className="w-full">
                <PlusCircle className="ml-2 h-4 w-4" />
                واریز
            </Button>
            <Button variant="outline" className="w-full">
                <MinusCircle className="ml-2 h-4 w-4" />
                برداشت
            </Button>
          </CardFooter>
        </Card>

        {/* Asset Breakdown Card */}
        <Card className="lg:col-span-3 xl:col-span-3">
            <CardHeader>
                <CardTitle>تفکیک دارایی‌ها</CardTitle>
                <CardDescription>موجودی شما در هر یک از صندوق‌های سرمایه‌گذاری.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>صندوق</TableHead>
                            <TableHead className="text-right">مقدار</TableHead>
                            <TableHead className="text-right">ارزش (دلار)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {assetData.map((asset) => (
                            <TableRow key={asset.fund}>
                                <TableCell className="font-medium flex items-center">{asset.icon} {asset.fund}</TableCell>
                                <TableCell className="text-right font-mono">{asset.amount.toLocaleString()}</TableCell>
                                <TableCell className="text-right font-mono">${asset.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>

       {/* Transaction History Card */}
      <Card>
        <CardHeader>
            <CardTitle>تاریخچه تراکنش‌های کیف پول</CardTitle>
            <CardDescription>لیست ۵ تراکنش آخر کیف پول شما.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>شناسه</TableHead>
                        <TableHead>نوع</TableHead>
                        <TableHead>وضعیت</TableHead>
                        <TableHead>تاریخ</TableHead>
                        <TableHead className="text-right">مبلغ (دلار)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactionHistory.map((tx) => (
                        <TableRow key={tx.id}>
                            <TableCell className="font-mono">{tx.id}</TableCell>
                            <TableCell className="font-medium">{tx.type}</TableCell>
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
      </Card>
    </>
  );
}
