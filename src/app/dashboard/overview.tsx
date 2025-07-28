
"use client";

import {
  Activity,
  ArrowUpRight,
  Bitcoin,
  CreditCard,
  Crown,
  DollarSign,
  Gift,
  Landmark,
  Loader2,
  Lock,
  Medal,
  PiggyBank,
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
import { getPlatformSettingsAction } from "@/app/actions/platform-settings";
import { getAllTransactionsAction } from "@/app/actions/transactions";
import { Progress } from "@/components/ui/progress";


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
    const [platformTvl, setPlatformTvl] = useState(0);
    const [bonusUnlockTarget, setBonusUnlockTarget] = useState(1000000);


    useEffect(() => {
        if (user) {
            setLoading(true);
            Promise.all([
                getUserDetailsAction({ userId: user.uid }),
                getAllTransactionsAction(),
                getPlatformSettingsAction()
            ]).then(([userDetails, allTransactions, settings]) => {
                setTransactions(userDetails.transactions.slice(0, 5));
                setStats(userDetails.stats);
                setChartData(userDetails.investmentChartData);
                const activeInvestments = allTransactions.transactions.filter(t => t.type === 'investment' && t.status === 'active');
                const totalTvl = activeInvestments.reduce((sum, inv) => sum + Math.abs(inv.amount), 0);
                setPlatformTvl(totalTvl);
                setBonusUnlockTarget(settings.bonusUnlockTarget);
            }).catch(error => {
                console.error("Failed to fetch dashboard data:", error);
            }).finally(() => {
                setLoading(false);
            });
        }
    }, [user]);

    const bonusProgress = Math.min((platformTvl / bonusUnlockTarget) * 100, 100);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">داشبورد</h1>
      </div>
       {stats?.lockedBonus && stats.lockedBonus > 0 && (
         <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
             <Card className="bg-primary/10 border-primary/40">
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <Gift className="w-12 h-12 text-primary flex-shrink-0" />
                    <div className="flex-grow">
                        <CardTitle>شما یک جایزه ۱۰۰ دلاری دارید!</CardTitle>
                        <CardDescription className="text-foreground/80 mt-1">
                            این جایزه با رسیدن حجم کل سرمایه پلتفرم به ${bonusUnlockTarget.toLocaleString()} آزاد خواهد شد.
                        </CardDescription>
                        <div className="mt-3">
                            <Progress value={bonusProgress} className="w-full h-2" />
                            <p className="text-xs text-muted-foreground mt-1 text-left">
                                ${platformTvl.toLocaleString()} / ${bonusUnlockTarget.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </CardHeader>
             </Card>
        </motion.div>
       )}
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ارزش کل دارایی</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                    <>
                        <div className="text-2xl font-bold font-mono">${((stats?.activeInvestment ?? 0) + (stats?.walletBalance ?? 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">
                          سرمایه فعال + کیف پول
                        </p>
                    </>
                )}
            </CardContent>
            </Card>
        </motion.div>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">سرمایه فعال</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                 {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                    <>
                        <div className="text-2xl font-bold font-mono">${(stats?.activeInvestment ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">
                        دارایی شما در صندوق‌ها
                        </p>
                    </>
                 )}
            </CardContent>
            </Card>
        </motion.div>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">موجودی قابل برداشت</CardTitle>
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                 {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                    <>
                        <div className="text-2xl font-bold font-mono">${(stats?.walletBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">
                          سودها و کمیسیون‌ها
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
                        <div className="text-2xl font-bold">{(stats?.lotteryTickets ?? 0).toLocaleString()}</div>
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
                 <CardDescription>نمودار رشد سرمایه‌گذاری شما در ۶ ماه گذشته.</CardDescription>
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
                        لیست آخرین رویدادهای مالی شما.
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
