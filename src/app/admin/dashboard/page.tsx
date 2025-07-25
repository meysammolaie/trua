
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { DollarSign, Users, Package, Activity, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const userGrowthData = [
  { month: "فروردین", users: 150 },
  { month: "اردیبهشت", users: 220 },
  { month: "خرداد", users: 310 },
  { month: "تیر", users: 450 },
  { month: "مرداد", users: 400 },
  { month: "شهریور", users: 520 },
];

const userGrowthChartConfig = {
  users: {
    label: "کاربر جدید",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const investmentByFundData = [
  { name: "طلا", value: 450000, color: "hsl(var(--chart-1))" },
  { name: "نقره", value: 250000, color: "hsl(var(--chart-2))" },
  { name: "دلار", value: 300000, color: "hsl(var(--chart-3))" },
  { name: "بیت‌کوین", value: 750000, color: "hsl(var(--chart-4))" },
];

const recentActivities = [
    { type: "new_user", detail: "کاربر جدیدی با ایمیل h.karimi@example.com ثبت نام کرد.", time: "۲ دقیقه پیش", status: "info" },
    { type: "investment", detail: "سرمایه‌گذاری جدید به مبلغ $2,500 در صندوق بیت‌کوین.", time: "۱۵ دقیقه پیش", status: "success" },
    { type: "withdrawal", detail: "درخواست برداشت به مبلغ $300 از طرف علی رضایی.", time: "۱ ساعت پیش", status: "warning" },
    { type: "lottery_win", detail: "مریم حسینی برنده قرعه کشی ماهانه با جایزه $5,000 شد.", time: "دیروز", status: "info" },
    { type: "failed_tx", detail: "تراکنش واریز کاربر reza.mohammadi ناموفق بود.", time: "۲ روز پیش", status: "error" },
];


export default function AdminDashboardPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">داشبورد مدیریت</h1>
      </div>
       <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">کل سرمایه در گردش</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold font-mono">$1,750,000</div>
                <p className="text-xs text-muted-foreground">
                +12.5% در ماه گذشته
                </p>
            </CardContent>
            </Card>
        </motion.div>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">مجموع کاربران</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">5,842</div>
                <p className="text-xs text-muted-foreground">
                +520 کاربر جدید در این ماه
                </p>
            </CardContent>
            </Card>
        </motion.div>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">سرمایه‌گذاری‌های فعال</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">8,123</div>
                <p className="text-xs text-muted-foreground">
                +680 در ماه گذشته
                </p>
            </CardContent>
            </Card>
        </motion.div>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.4 }}>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">درآمد ماهانه (کارمزد)</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold font-mono">$15,320.50</div>
                <p className="text-xs text-muted-foreground">
                +8.2% نسبت به ماه قبل
                </p>
            </CardContent>
            </Card>
        </motion.div>
      </div>

       <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
            <motion.div className="xl:col-span-2" variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.5 }}>
                <Card>
                    <CardHeader>
                        <CardTitle>روند رشد کاربران</CardTitle>
                        <CardDescription>
                            تعداد کاربران جدید ثبت‌نام شده در ۶ ماه گذشته.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={userGrowthChartConfig} className="h-[300px] w-full">
                            <BarChart accessibilityLayer data={userGrowthData}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                dataKey="month"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                tickFormatter={(value) => value.slice(0, 3)}
                                />
                                <YAxis />
                                <Tooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                                />
                                <Bar dataKey="users" fill="var(--color-users)" radius={8} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.6 }}>
                <Card>
                    <CardHeader>
                        <CardTitle>تفکیک سرمایه‌گذاری</CardTitle>
                        <CardDescription>
                            توزیع سرمایه در صندوق‌های مختلف.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={{}} className="h-[300px] w-full">
                            <PieChart>
                                <Tooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                                <Pie data={investmentByFundData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                                    {investmentByFundData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </motion.div>
       </div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.7 }}>
            <Card>
                <CardHeader>
                    <CardTitle>فعالیت‌های اخیر</CardTitle>
                    <CardDescription>
                    نمایش آخرین رویدادهای مهم در پلتفرم.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {recentActivities.map((activity, index) => (
                        <div key={index} className="flex items-start gap-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm">{activity.detail}</p>
                                <time className="text-xs text-muted-foreground">{activity.time}</time>
                            </div>
                            <Badge variant={activity.status === 'success' ? 'secondary' : activity.status === 'error' ? 'destructive' : 'outline'}>
                                {activity.type === 'new_user' && 'کاربر جدید'}
                                {activity.type === 'investment' && 'سرمایه‌گذاری'}
                                {activity.type === 'withdrawal' && 'برداشت'}
                                {activity.type === 'lottery_win' && 'قرعه‌کشی'}
                                {activity.type === 'failed_tx' && 'ناموفق'}
                            </Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </motion.div>
    </>
  );
}

    