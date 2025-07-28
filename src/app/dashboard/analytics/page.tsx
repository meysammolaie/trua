
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
  ChartConfig
} from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Tooltip
} from "recharts";
import { DollarSign, Users, Ticket, TrendingUp, Loader2, ArrowLeftRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getPlatformAnalyticsAction } from "@/app/actions/platform-analytics";
import type { PlatformAnalyticsData, FundStat } from "@/ai/flows/get-platform-analytics-flow";

const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PlatformAnalyticsData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const analyticsData = await getPlatformAnalyticsAction();
        setData(analyticsData);
      } catch (error) {
        console.error("Failed to fetch platform analytics data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fundChartConfig: ChartConfig = (data?.fundStats || []).reduce((config, fund, index) => {
    config[fund.id] = { label: fund.name, color: `hsl(var(--chart-${index + 1}))` };
    return config;
  }, {} as ChartConfig);

  const tvlChartConfig: ChartConfig = {
    tvl: { label: "ارزش کل", color: "hsl(var(--primary))" }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">تحلیل بازار</h1>
      </div>
      
       <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">کل سرمایه فعال (TVL)</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : (
                    <div className="text-2xl font-bold font-mono">{formatCurrency(data?.totalTVL ?? 0)}</div>
                )}
                 <p className="text-xs text-muted-foreground">مجموع سرمایه خالص در تمام صندوق‌ها</p>
            </CardContent>
            </Card>
        </motion.div>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">سرمایه‌گذاران فعال</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : (
                    <div className="text-2xl font-bold">{data?.totalActiveInvestors.toLocaleString() ?? 0}</div>
                )}
                 <p className="text-xs text-muted-foreground">تعداد کاربران با سرمایه فعال</p>
            </CardContent>
            </Card>
        </motion.div>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">صندوق قرعه‌کشی</CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : (
                    <div className="text-2xl font-bold font-mono">{formatCurrency(data?.totalLotteryPool ?? 0)}</div>
                )}
                <p className="text-xs text-muted-foreground">آماده برای قرعه‌کشی بعدی</p>
            </CardContent>
            </Card>
        </motion.div>
      </div>

       <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
            <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.5 }}>
                 <Card>
                    <CardHeader>
                        <CardTitle>تفکیک سرمایه در صندوق‌ها</CardTitle>
                        <CardDescription>
                            مشاهده کنید که چگونه سرمایه کل بین صندوق‌های مختلف توزیع شده است.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? <div className="h-[300px] flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                            <ChartContainer config={fundChartConfig} className="h-[300px] w-full">
                                <BarChart accessibilityLayer data={data?.fundStats} layout="vertical" margin={{ left: 10 }}>
                                    <CartesianGrid horizontal={false} />
                                    <YAxis
                                    dataKey="name"
                                    type="category"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    />
                                    <XAxis dataKey="totalValue" type="number" hide />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted))' }}
                                        content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)}/>}
                                    />
                                    <Bar dataKey="totalValue" layout="vertical" radius={5}>
                                         {data?.fundStats.map((fund, index) => (
                                            <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${index + 1}))`} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.6 }}>
                 <Card>
                    <CardHeader>
                        <CardTitle>روند رشد پلتفرم</CardTitle>
                        <CardDescription>
                            نمودار رشد کل سرمایه فعال (TVL) در پلتفرم در طول زمان.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? <div className="h-[300px] flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                            <ChartContainer config={tvlChartConfig} className="h-[300px] w-full">
                                <LineChart accessibilityLayer data={data?.tvlGrowthData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                    <YAxis tickFormatter={(value) => formatCurrency(value as number)} />
                                    <Tooltip content={<ChartTooltipContent indicator="line" formatter={(value) => formatCurrency(value as number)}/>}/>
                                    <Line type="monotone" dataKey="tvl" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
       </div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.7 }}>
            <Card className="bg-gradient-to-br from-primary/10 to-transparent">
                <CardHeader>
                    <CardTitle>شما، موتور رشد ما هستید!</CardTitle>
                    <CardDescription>
                        در Trusva، سود شما مستقیماً به رشد جامعه بستگی دارد. هر سرمایه‌گذار جدید، استخر سود روزانه را بزرگ‌تر می‌کند و این یعنی درآمد بیشتر برای همه!
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-foreground/90 mb-4">
                        با دعوت از دوستانتان، شما نه تنها **کمیسیون مستقیم** از اولین سرمایه‌گذاری آن‌ها دریافت می‌کنید، بلکه به طور دائمی به **بزرگ‌تر شدن سود روزانه خودتان** نیز کمک می‌کنید. این یک موقعیت برد-برد است.
                    </p>
                    <Button asChild>
                        <Link href="/dashboard/referrals">
                           <ArrowLeftRight className="w-4 h-4 ml-2"/>
                            شروع به معرفی و کسب درآمد کنید
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    </>
  );
}

// Need to import Cell for BarChart custom colors
import { Cell } from "recharts";
