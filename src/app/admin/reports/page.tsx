
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
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/date-range-picker";
import { FileDown, DollarSign, Users, Ticket, Loader2, PlayCircle, Unlock, PiggyBank, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TransactionWithUser, AllTransactionsStats, FundStat } from "@/ai/flows/get-all-transactions-flow";
import { getAllTransactionsAction } from "@/app/actions/transactions";
import { useToast } from "@/hooks/use-toast";
import { distributeProfitsAction, unlockBonusesAction } from "@/app/actions/reports";

export default function AdminReportsPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [isDistributing, setIsDistributing] = useState(false);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [transactions, setTransactions] = useState<TransactionWithUser[]>([]);
    const [stats, setStats] = useState<AllTransactionsStats | null>(null);

     const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAllTransactionsAction();
            const financialEvents = data.transactions;
            setTransactions(financialEvents.slice(0, 10)); // Show latest 10
            setStats(data.stats);
        } catch (error) {
            console.error("Failed to fetch transaction data:", error);
            toast({
                variant: "destructive",
                title: "خطای واکشی",
                description: "مشکلی در دریافت اطلاعات گزارشات مالی رخ داد."
            })
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDistributeProfits = async () => {
        setIsDistributing(true);
        toast({ title: "عملیات در حال انجام", description: "توزیع سود آغاز شد..."});
        try {
            const result = await distributeProfitsAction();
            if (result.success) {
                toast({
                    title: "عملیات موفق",
                    description: result.message,
                });
                await fetchData(); // Refresh data after distribution
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
             toast({
                variant: "destructive",
                title: "خطا در توزیع سود",
                description: error instanceof Error ? error.message : "یک خطای ناشناخته رخ داد."
            });
        } finally {
            setIsDistributing(false);
        }
    }
    
    const handleUnlockBonuses = async () => {
        setIsUnlocking(true);
        toast({ title: "عملیات در حال انجام", description: "آزادسازی جوایز آغاز شد..."});
        try {
            const result = await unlockBonusesAction();
            if (result.success) {
                toast({
                    title: "عملیات موفق",
                    description: result.message,
                });
                await fetchData(); // Refresh data after unlocking
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
             toast({
                variant: "destructive",
                title: "خطا در آزادسازی جوایز",
                description: error instanceof Error ? error.message : "یک خطای ناشناخته رخ داد."
            });
        } finally {
            setIsUnlocking(false);
        }
    }

    const typeNames: Record<string, string> = {
        investment: "سرمایه‌گذاری",
        profit_payout: "واریز سود",
        commission: "کمیسیون",
        principal_return: "بازگشت اصل پول",
        withdrawal_request: "درخواست برداشت",
        withdrawal_refund: "لغو برداشت",
        bonus: "جایزه"
    };
    
    const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">گزارشات مالی و عملیات</h1>
        <div className="flex items-center gap-2">
            <DateRangePicker />
            <Button variant="outline">
                <FileDown className="h-4 w-4 ml-2" />
                دریافت خروجی
            </Button>
        </div>
      </div>

       <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">موجودی کل پلتفرم (TVL)</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin"/> :
                <div className="text-2xl font-bold font-mono">{formatCurrency(stats?.totalPlatformWallet ?? 0)}</div>
            }
            <p className="text-xs text-muted-foreground">
              مجموع سرمایه خالص و فعال کاربران
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">استخر سود (آماده توزیع)</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin"/> :
                <div className="text-2xl font-bold font-mono">{formatCurrency(stats?.totalProfitPool ?? 0)}</div>
            }
            <p className="text-xs text-muted-foreground">
              مجموع کارمزدهای ورود و خروج
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مجموع درآمد پلتفرم</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin"/> :
                <div className="text-2xl font-bold font-mono">{formatCurrency(stats?.totalPlatformRevenue ?? 0)}</div>
            }
            <p className="text-xs text-muted-foreground">
              فقط از محل کارمزد ۱٪ پلتفرم
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">موجودی کل صندوق قرعه‌کشی</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin"/> :
                <div className="text-2xl font-bold font-mono">{formatCurrency(stats?.totalLotteryPool ?? 0)}</div>
            }
            <p className="text-xs text-muted-foreground">
              آماده برای قرعه‌کشی‌های ماهانه
            </p>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {(stats?.fundStats || []).map((fund) => (
            <Card key={fund.id}>
                <CardHeader>
                    <CardTitle className="text-base">صندوق {fund.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">استخر سود روزانه:</span>
                        <span className="font-mono">{formatCurrency(fund.profitPool)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">موجودی قرعه‌کشی:</span>
                        <span className="font-mono">{formatCurrency(fund.lotteryPool)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">درآمد پلتفرم:</span>
                        <span className="font-mono">{formatCurrency(fund.platformRevenue)}</span>
                    </div>
                </CardContent>
            </Card>
        ))}
       </div>
      
       <div className="grid gap-4 md:grid-cols-2 lg:gap-8">
        <Card>
            <CardHeader>
                <CardTitle>توزیع سود روزانه</CardTitle>
                <CardDescription>
                    با اجرای این عملیات، سود انباشته شده از کارمزدها (ورود و خروج) بین سرمایه‌گذاران فعال هر صندوق توزیع می‌شود.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Button className="w-full" onClick={handleDistributeProfits} disabled={isDistributing || loading}>
                    {isDistributing ? (
                        <>
                            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                            در حال توزیع سود...
                        </>
                    ) : (
                        <>
                             <PlayCircle className="h-4 w-4 ml-2" />
                            اجرای توزیع سود
                        </>
                    )}
                 </Button>
            </CardContent>
             <CardFooter>
                <p className="text-xs text-muted-foreground">
                    این عملیات، کارمزدهای جدید را بین کاربران فعال توزیع می‌کند.
                </p>
             </CardFooter>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>آزادسازی جوایز</CardTitle>
                <CardDescription>
                   این عملیات تمام جوایز قفل‌شده کاربران را آزاد و به کیف پولشان اضافه می‌کند.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Button variant="secondary" className="w-full" onClick={handleUnlockBonuses} disabled={isUnlocking || loading}>
                    {isUnlocking ? (
                        <>
                            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                            در حال آزادسازی...
                        </>
                    ) : (
                        <>
                             <Unlock className="h-4 w-4 ml-2" />
                            اجرای آزادسازی جوایز
                        </>
                    )}
                 </Button>
            </CardContent>
             <CardFooter>
                <p className="text-xs text-muted-foreground">
                    این دکمه را فقط زمانی بزنید که شرط آزادسازی جوایز محقق شده باشد.
                </p>
             </CardFooter>
        </Card>
      </div>

       <Card>
            <CardHeader>
                <CardTitle>رویدادهای مالی اخیر</CardTitle>
                <CardDescription>
                    لیست آخرین رویدادهای مالی ثبت شده در سیستم.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>شناسه</TableHead>
                            <TableHead>نوع رویداد</TableHead>
                            <TableHead>جزئیات</TableHead>
                            <TableHead>تاریخ</TableHead>
                            <TableHead className="text-right">مبلغ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                             <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                    <div className="flex justify-center items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin"/>
                                        <span>در حال بارگذاری رویدادها...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                   هیچ رویداد مالی برای نمایش وجود ندارد.
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions.map((event) => (
                                <TableRow key={event.id}>
                                    <TableCell className="font-mono">{event.id.substring(0, 8)}...</TableCell>
                                    <TableCell>
                                        <Badge variant={event.amount > 0 ? "secondary" : "destructive"}>
                                            {typeNames[event.type] || event.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{event.userFullName}</TableCell>
                                    <TableCell>{event.createdAt}</TableCell>
                                    <TableCell className={`text-right font-mono ${event.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {event.amount > 0 ? '+' : ''}${Math.abs(event.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
             <CardFooter>
                <div className="text-xs text-muted-foreground">
                    نمایش <strong>{transactions.length}</strong> از آخرین رویدادهای مالی
                </div>
            </CardFooter>
       </Card>
    </>
  );
}
