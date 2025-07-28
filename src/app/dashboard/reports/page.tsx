
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
import { Loader2, Copy, DollarSign, Wallet, PiggyBank } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { GetUserDetailsOutput } from "@/ai/flows/get-user-details-flow";
import { getUserDetailsAction } from "@/app/actions/user-details";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast";


type Transaction = GetUserDetailsOutput["transactions"][0];
type Stats = GetUserDetailsOutput["stats"];


export default function ReportsPage() {
    const { user } = useAuth();
    const [transactions, setTransactions] = React.useState<Transaction[]>([]);
    const [stats, setStats] = React.useState<Stats | null>(null);
    const [loading, setLoading] = React.useState(true);
    const { toast } = useToast();

    React.useEffect(() => {
        if (user) {
            setLoading(true);
            getUserDetailsAction({ userId: user.uid })
                .then(response => {
                    setTransactions(response.transactions);
                    setStats(response.stats);
                })
                .catch(error => {
                    console.error("Failed to fetch transactions:", error);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [user]);

    const copyProof = (proof: string) => {
        navigator.clipboard.writeText(proof);
        toast({ title: "کپی شد", description: "رسید تراکنش در کلیپ‌بورد کپی شد." });
    }

    const typeNames: Record<string, string> = {
        investment: "سرمایه‌گذاری",
        profit_payout: "واریز سود",
        withdrawal: "برداشت وجه",
        withdrawal_request: "درخواست برداشت",
    };

    const statusColors: Record<string, "secondary" | "outline" | "destructive" | "default"> = {
        "فعال": "secondary",
        "در انتظار": "outline",
        "تکمیل شده": "default",
        "موفق": "default",
        "رد شده": "destructive",
    }


  return (
    <TooltipProvider>
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">گزارش‌ها و تاریخچه مالی</h1>
      </div>
       <div className="grid gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>ارزش کل دارایی</CardDescription>
            {loading ? <Loader2 className="h-8 w-8 animate-spin mt-2" /> : <CardTitle className="text-4xl font-mono">${stats?.walletBalance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) ?? '0.00'}</CardTitle>}
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              مجموع ارزش دارایی‌های شما (سرمایه فعال + موجودی قابل برداشت)
            </div>
          </CardContent>
        </Card>
         <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">سرمایه فعال</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                     {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold font-mono">${stats?.activeInvestment.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) ?? '0.00'}</div>}
                    <p className="text-xs text-muted-foreground">ارزش خالص دارایی‌های شما در صندوق‌ها</p>
                </CardContent>
            </Card>
            <Card>
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">موجودی قابل برداشت</CardTitle>
                    <PiggyBank className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold font-mono">${stats?.totalProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) ?? '0.00'}</div>}
                    <p className="text-xs text-muted-foreground">موجودی آزاد شامل سودها و جوایز</p>
                </CardContent>
            </Card>
         </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>تاریخچه کامل تراکنش‌ها</CardTitle>
          <CardDescription>
            تمام فعالیت‌های مالی خود را در اینجا مشاهده و مدیریت کنید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نوع</TableHead>
                <TableHead>صندوق/مقصد</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>تاریخ</TableHead>
                <TableHead className="text-right">مبلغ (دلار)</TableHead>
                <TableHead className="text-center">رسید</TableHead>
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
                    <TableCell className="font-medium">{typeNames[tx.type] || tx.type}</TableCell>
                    <TableCell>{tx.fund}</TableCell>
                    <TableCell>
                        <Badge variant={statusColors[tx.status] || 'default'}>
                        {tx.status}
                        </Badge>
                    </TableCell>
                    <TableCell>{tx.date}</TableCell>
                    <TableCell className={`text-right font-mono ${tx.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                        {tx.proof ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => copyProof(tx.proof!)}>
                                        <Copy className="h-4 w-4 text-blue-400" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-mono text-xs">{tx.proof}</p>
                                    <p>برای کپی کلیک کنید</p>
                                </TooltipContent>
                            </Tooltip>
                        ) : '-'}
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
             <Button variant="outline" disabled={true}>بارگذاری بیشتر</Button>
        </CardFooter>
      </Card>
    </>
    </TooltipProvider>
  );
}
