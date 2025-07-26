
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
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, Line, LineChart as RechartsLineChart } from "recharts";
import { DateRangePicker } from "@/components/date-range-picker";
import { FileDown, DollarSign, Users, Ticket, TrendingUp, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getAllTransactions, TransactionWithUser, AllTransactionsStats } from "@/ai/flows/get-all-transactions-flow";

const revenueChartConfig = {
  revenue: {
    label: "درآمد",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const profitChartConfig = {
  profit: {
    label: "سود",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export default function AdminReportsPage() {
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<TransactionWithUser[]>([]);
    const [stats, setStats] = useState<AllTransactionsStats | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await getAllTransactions();
                // We only want financial events (fees, profits, etc.) not structural ones like investment
                const financialEvents = data.transactions.filter(t => ['fee_entry', 'fee_lottery', 'fee_platform', 'profit_payout', 'lottery_win', 'withdrawal_fee'].includes(t.type));
                setTransactions(financialEvents.slice(0, 5)); // Show 5 most recent
                setStats(data.stats);
            } catch (error) {
                console.error("Failed to fetch transaction data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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
            <CardTitle className="text-sm font-medium">سود پرداخت شده (نمایشی)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin"/> :
                <div className="text-2xl font-bold font-mono">$0.00</div>
            }
            <p className="text-xs text-muted-foreground">
              قابلیت توزیع سود پیاده‌سازی نشده
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
                <CardTitle>نمودار درآمد کارمزدها (نمایشی)</CardTitle>
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
        <Card>
            <CardHeader>
                <CardTitle>نمودار سود پرداخت شده (نمایشی)</CardTitle>
                <CardDescription>نمایش روند پرداخت سود ماهانه به کاربران.</CardDescription>
            </CardHeader>
            <CardContent>
                 {loading ? <div className="h-[250px] flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div> : 
                 <ChartContainer config={profitChartConfig} className="h-[250px] w-full">
                    <RechartsLineChart
                        accessibilityLayer
                        data={[]} // Placeholder for profit data
                        margin={{ top: 5, right: 20, left: -10, bottom: 0 }}
                        >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                        />
                         <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                            dataKey="profit"
                            type="monotone"
                            stroke="var(--color-profit)"
                            strokeWidth={2}
                            dot={false}
                        />
                    </RechartsLineChart>
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
