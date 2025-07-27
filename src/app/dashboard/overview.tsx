
"use client";

import {
  Activity,
  ArrowUpRight,
  Bitcoin,
  CreditCard,
  Crown,
  DollarSign,
  Landmark,
  Loader2,
  Medal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { GetUserDetailsOutput } from "@/ai/flows/get-user-details-flow";
import { getUserDetailsAction } from "@/app/actions/user-details";


type UserDetails = GetUserDetailsOutput;
type Transaction = UserDetails["transactions"][0];
type Stats = UserDetails["stats"];
type ChartData = UserDetails["investmentChartData"];

const chartConfig = {
  investment: {
    label: "سرمایه (دلار)",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const funds = [
  {
    name: "صندوق طلا",
    icon: <Crown className="w-6 h-6 text-yellow-500" />,
    apy: "۱۲.۵٪",
  },
  {
    name: "صندوق نقره",
    icon: <Medal className="w-6 h-6 text-slate-400" />,
    apy: "۹.۸٪",
  },
  {
    name: "صندوق دلار",
    icon: <Landmark className="w-6 h-6 text-green-500" />,
    apy: "۷.۲٪",
  },
  {
    name: "صندوق بیت‌کوین",
    icon: <Bitcoin className="w-6 h-6 text-orange-500" />,
    apy: "۲۵.۱٪",
  },
];


const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};


export function Overview() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [chartData, setChartData] = useState<ChartData>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            setLoading(true);
            getUserDetailsAction({ userId: user.uid })
                .then(response => {
                    setTransactions(response.transactions.slice(0, 5));
                    setStats(response.stats);
                    setChartData(response.investmentChartData);
                })
                .catch(error => {
                    console.error("Failed to fetch user details:", error);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [user]);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">داشبورد</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">سرمایه خالص فعال</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                    <>
                        <div className="text-2xl font-bold font-mono">${stats?.netInvestment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}</div>
                        <p className="text-xs text-muted-foreground">
                          (سرمایه ناخالص: ${stats?.grossInvestment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'})
                        </p>
                    </>
                )}
            </CardContent>
            </Card>
        </motion.div>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">سود کل</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                 {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                    <>
                        <div className="text-2xl font-bold font-mono">${stats?.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}</div>
                        <p className="text-xs text-muted-foreground">
                        +۰٪ نسبت به ماه گذشته (بزودی)
                        </p>
                    </>
                 )}
            </CardContent>
            </Card>
        </motion.div>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">موجودی کیف پول</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                 {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                    <>
                        <div className="text-2xl font-bold font-mono">${stats?.walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}</div>
                        <p className="text-xs text-muted-foreground">
                          موجودی قابل برداشت شما
                        </p>
                    </>
                 )}
            </CardContent>
            </Card>
        </motion.div>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.4 }}>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">تیکت‌های قرعه‌کشی</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                    <>
                        <div className="text-2xl font-bold">{stats?.lotteryTickets.toLocaleString() ?? 0}</div>
                        <p className="text-xs text-muted-foreground">
                         برای قرعه‌کشی این ماه
                        </p>
                    </>
                )}
            </CardContent>
            </Card>
        </motion.div>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <motion.div className="xl:col-span-2 grid gap-4" variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.5 }}>
             <Card >
              <CardHeader>
                <CardTitle>نمای کلی پرتفوی</CardTitle>
                 <CardDescription>نمودار رشد سرمایه‌گذاری خالص شما در ۶ ماه گذشته.</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                {loading ? <div className="h-[250px] flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart accessibilityLayer data={chartData}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Bar dataKey="investment" fill="var(--color-investment)" radius={8} />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>صندوق‌های سرمایه‌گذاری</CardTitle>
                    <CardDescription>
                        در صندوق‌های متنوع ما سرمایه‌گذاری کنید و سود کسب کنید.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {funds.map((fund) => (
                        <Card key={fund.name} className="hover:bg-muted/50 transition-colors duration-300">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="flex items-center gap-2">
                                    {fund.icon}
                                    <CardTitle className="text-base font-semibold">{fund.name}</CardTitle>
                                </div>
                                 <Button asChild size="sm">
                                    <Link href="/dashboard/invest">سرمایه‌گذاری</Link>
                                 </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-bold">APY: {fund.apy}</div>
                                <p className="text-xs text-muted-foreground">سود سالانه تخمینی</p>
                            </CardContent>
                        </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
       
        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.6 }}>
            <Card>
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle>تراکنش‌های اخیر</CardTitle>
                    <CardDescription>
                        لیست واریز و برداشت‌های اخیر شما.
                    </CardDescription>
                </div>
                <Button asChild size="sm" className="ml-auto gap-1">
                <Link href="/dashboard/reports">
                    مشاهده همه
                    <ArrowUpRight className="h-4 w-4" />
                </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>نوع</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead className="text-right">مبلغ</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                   {loading ? (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center py-10">
                                <div className="flex justify-center items-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin"/>
                                    <span>در حال بارگذاری تراکنش‌ها...</span>
                                </div>
                            </TableCell>
                        </TableRow>
                   ) : transactions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center py-10">
                                هیچ تراکنشی یافت نشد.
                            </TableCell>
                        </TableRow>
                   ) : (
                    transactions.map((tx) => (
                        <TableRow key={tx.id}>
                            <TableCell>
                                <div className="font-medium">{tx.type}</div>
                                <div className="hidden text-sm text-muted-foreground md:inline">
                                    {tx.date}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge className="text-xs" variant={tx.status === 'فعال' ? 'secondary' : tx.status === 'در انتظار' ? 'outline' : 'destructive'}>
                                    {tx.status}
                                </Badge>
                            </TableCell>
                            <TableCell className={`text-right font-mono ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                        </TableRow>
                   )))}
                </TableBody>
                </Table>
            </CardContent>
            </Card>
        </motion.div>
      </div>
    </>
  );
}
