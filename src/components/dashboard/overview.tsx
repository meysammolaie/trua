
"use client";

import {
  Activity,
  ArrowUpRight,
  Bitcoin,
  CreditCard,
  Crown,
  DollarSign,
  Landmark,
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

const chartData = [
  { month: "فروردین", value: 1860.5 },
  { month: "اردیبهشت", value: 2205.1 },
  { month: "خرداد", value: 2537.9 },
  { month: "تیر", value: 2873.4 },
  { month: "مرداد", value: 3209.2 },
  { month: "شهریور", value: 3514.8 },
];
const chartConfig = {
  value: {
    label: "ارزش کل (دلار)",
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

const recentTransactions = [
    { id: "TXN729", user: "علی رضایی", type: "واریز", status: "موفق", date: "۱۴۰۳/۰۴/۰۱", amount: 2000.00 },
    { id: "TXN730", user: "علی رضایی", type: "برداشت", status: "در حال انجام", date: "۱۴۰۳/۰۴/۰۲", amount: -500.00 },
    { id: "TXN731", user: "علی رضایی", type: "سود روزانه", status: "موفق", date: "۱۴۰۳/۰۴/۰۳", amount: 35.70 },
    { id: "INV001", user: "علی رضایی", type: "سرمایه‌گذاری", status: "موفق", date: "۱۴۰۳/۰۴/۰۳", amount: -1000.00 },
    { id: "TXN733", user: "علی رضایی", type: "واریز", status: "ناموفق", date: "۱۴۰۳/۰۴/۰۴", amount: 1500.00 },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};


export function Overview() {
    const { user } = useAuth();
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">داشبورد</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">مجموع سرمایه</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold font-mono">$35,231.89</div>
                <p className="text-xs text-muted-foreground">
                +۲۰.۱٪ نسبت به ماه گذشته
                </p>
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
                <div className="text-2xl font-bold font-mono">$2,350.00</div>
                <p className="text-xs text-muted-foreground">
                +۱۸۰.۱٪ نسبت به ماه گذشته
                </p>
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
                <div className="text-2xl font-bold font-mono">$5,230.50</div>
                <p className="text-xs text-muted-foreground">
                +۱۹٪ نسبت به ماه گذشته
                </p>
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
                <div className="text-2xl font-bold">573</div>
                <p className="text-xs text-muted-foreground">
                +۲۱ از آخرین قرعه‌کشی
                </p>
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
                    <Bar dataKey="value" fill="var(--color-value)" radius={8} />
                  </BarChart>
                </ChartContainer>
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
                   {recentTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                        <TableCell>
                            <div className="font-medium">{tx.type}</div>
                            <div className="hidden text-sm text-muted-foreground md:inline">
                                {tx.date}
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge className="text-xs" variant={tx.status === 'موفق' ? 'secondary' : tx.status === 'ناموفق' ? 'destructive' : 'outline'}>
                                {tx.status}
                            </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-mono ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                           {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                    </TableRow>
                   ))}
                </TableBody>
                </Table>
            </CardContent>
            </Card>
        </motion.div>
      </div>
    </>
  );
}
