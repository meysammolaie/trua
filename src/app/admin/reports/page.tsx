
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { DateRangePicker } from "@/components/date-range-picker";
import { FileDown, DollarSign, Users, Ticket, TrendingUp, Loader2, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TransactionWithUser, AllTransactionsStats } from "@/ai/flows/get-all-transactions-flow";
import { getAllTransactionsAction } from "@/app/actions/transactions";
import { useToast } from "@/hooks/use-toast";
import { distributeProfitsAction } from "@/app/actions/reports";

const revenueChartConfig = {
  revenue: {
    label: "درآمد",
    color: "hsl(var(--primary))",
  },
};

export default function AdminReportsPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [isDistributing, setIsDistributing] = useState(false);
    const [transactions, setTransactions] = useState<TransactionWithUser[]>([]);
    const [stats, setStats] = useState<AllTransactionsStats | null>(null);

     const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAllTransactionsAction();
            // Filter for financial events to show in the recent list
            const financialEvents = data.transactions.filter(t => ['profit_payout', 'investment'].includes(t.type) || t.type.startsWith('fee_'));
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

    const typeNames: Record<string, string> = {
        fee_entry: "کارمزد ورود",
        fee_lottery: "کارمزد قرعه‌کشی",
        fee_platform: "کارمزد پلتفرم",
        profit_payout: "پرداخت سود",
        lottery_win: "جایزه قرعه‌کشی",
        withdrawal_fee: "کارمزد خروج",
        deposit: "واریز",
        investment: "سرمایه‌گذاری",
        withdrawal: "برداشت",
    };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">گزارشات مالی</h1>
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
            <CardTitle className="text-sm font-medium">مجموع درآمد کارمزد</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin"/> :
                <div className="text-2xl font-bold font-mono">${stats?.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            }
            <p className="text-xs text-muted-foreground">
              از تمام انواع کارمزدها
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">سود پرداخت شده</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin"/> :
                <div className="text-2xl font-bold font-mono">$0.00</div>
            }
            <p className="text-xs text-muted-foreground">
              مجموع سودهای توزیع شده بین کاربران
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">موجودی صندوق قرعه‌کشی</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin"/> :
                <div className="text-2xl font-bold font-mono">${stats?.lotteryPool.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            }
            <p className="text-xs text-muted-foreground">
              آماده برای قرعه‌کشی بعدی
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تعداد کل تراکنش‌ها</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin"/> :
                <div className="text-2xl font-bold">{stats?.totalTransactions.toLocaleString()}</div>
            }
            <p className="text-xs text-muted-foreground">
              تمام رویدادهای مالی ثبت شده
            </p>
          </CardContent>
        </Card>
      </div>
      
       <div className="grid gap-4 md:grid-cols-2 lg:gap-8">
        <Card>
            <CardHeader>
                <CardTitle>توزیع سود روزانه</CardTitle>
                <CardDescription>
                    با اجرای این عملیات، سود انباشته شده از کارمزدها بین سرمایه‌گذاران فعال توزیع می‌شود.
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
                    این عملیات باید به صورت روزانه اجرا شود. در آینده می‌توان آن را به صورت خودکار زمان‌بندی کرد.
                </p>
             </CardFooter>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>نمودار درآمد کارمزدها</CardTitle>
                <CardDescription>نمایش روند درآمد ماهانه از کارمزدها.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? <div className="h-[250px] flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div> : 
                <ChartContainer config={revenueChartConfig} className="h-[250px] w-full">
                  <BarChart accessibilityLayer data={stats?.revenueChartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                    />
                     <YAxis />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={8} />
                  </BarChart>
                </ChartContainer>
                }
            </CardContent>
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
