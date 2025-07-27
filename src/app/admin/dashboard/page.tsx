
"use client";

import { useState, useEffect } from "react";
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
  Legend,
} from "recharts";
import { DollarSign, Users, Package, Activity, TrendingUp, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { AdminDashboardData } from "@/ai/flows/get-admin-dashboard-data-flow";
import { getAdminDashboardDataAction } from "@/app/actions/dashboard";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const userGrowthChartConfig = {
  users: {
    label: "کاربر جدید",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminDashboardData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const dashboardData = await getAdminDashboardDataAction();
        setData(dashboardData);
      } catch (error) {
        console.error("Failed to fetch admin dashboard data:", error);
        // TODO: Add toast notification for error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const investmentByFundData = data?.investmentByFundData.map((item, index) => ({
      ...item,
      color: `hsl(var(--chart-${index + 1}))`
  })) || [];


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
                {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : (
                    <>
                        <div className="text-2xl font-bold font-mono">${data?.stats.totalTVL.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        <p className="text-xs text-muted-foreground">
                        مجموع سرمایه‌گذاری‌های فعال
                        </p>
                    </>
                )}
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
                {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : (
                    <>
                        <div className="text-2xl font-bold">{data?.stats.totalUsers.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                        کاربر ثبت‌شده در کل
                        </p>
                    </>
                )}
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
                {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : (
                    <>
                        <div className="text-2xl font-bold">{data?.stats.activeInvestments.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                        تعداد سرمایه‌گذاری‌های در انتظار و فعال
                        </p>
                    </>
                )}
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
                {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : (
                    <>
                        <div className="text-2xl font-bold font-mono">${data?.stats.monthlyRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        <p className="text-xs text-muted-foreground">
                        درآمد از کارمزدها در ۳۰ روز گذشته
                        </p>
                    </>
                )}
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
                        {loading ? <div className="h-[300px] flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                            <ChartContainer config={userGrowthChartConfig} className="h-[300px] w-full">
                                <BarChart accessibilityLayer data={data?.userGrowthData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                    dataKey="month"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    />
                                    <YAxis allowDecimals={false}/>
                                    <Tooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Bar dataKey="users" fill="var(--color-users)" radius={8} />
                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.6 }}>
                <Card>
                    <CardHeader>
                        <CardTitle>تفکیک سرمایه‌گذاری</CardTitle>
                        <CardDescription>
                            توزیع سرمایه فعال در صندوق‌های مختلف.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         {loading ? <div className="h-[300px] flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                            <ChartContainer config={{}} className="h-[300px] w-full">
                                <PieChart>
                                    <Tooltip formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name]} />
                                    <Legend />
                                    <Pie data={investmentByFundData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                                        {investmentByFundData.map((entry) => (
                                            <Cell key={`cell-${entry.name}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ChartContainer>
                         )}
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
                     {loading ? <div className="h-[150px] flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div> : 
                     data?.recentActivities.length === 0 ? <p className="text-muted-foreground text-center">فعالیتی برای نمایش وجود ندارد.</p> :
                     (
                        data?.recentActivities.map((activity, index) => (
                            <div key={index} className="flex items-start gap-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm">{activity.detail}</p>
                                    <time className="text-xs text-muted-foreground">{activity.time}</time>
                                </div>
                                <Badge variant={activity.status === 'success' ? 'secondary' : 'outline'}>
                                    {activity.type === 'new_user' && 'کاربر جدید'}
                                    {activity.type === 'investment' && 'سرمایه‌گذاری'}
                                </Badge>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </motion.div>
    </>
  );
}
