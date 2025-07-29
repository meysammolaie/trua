
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
import type { PlatformAnalyticsData } from "@/ai/flows/get-platform-analytics-flow";

const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
    tvl: { label: "Total Value", color: "hsl(var(--primary))" }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Market Analysis</h1>
      </div>
      
       <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value Locked (TVL)</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : (
                    <div className="text-2xl font-bold font-mono">{formatCurrency(data?.totalTVL ?? 0)}</div>
                )}
                 <p className="text-xs text-muted-foreground">Sum of net capital in all funds</p>
            </CardContent>
            </Card>
        </motion.div>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Investors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : (
                    <div className="text-2xl font-bold">{data?.totalActiveInvestors.toLocaleString() ?? 0}</div>
                )}
                 <p className="text-xs text-muted-foreground">Number of users with active capital</p>
            </CardContent>
            </Card>
        </motion.div>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lottery Pool</CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : (
                    <div className="text-2xl font-bold font-mono">{formatCurrency(data?.totalLotteryPool ?? 0)}</div>
                )}
                <p className="text-xs text-muted-foreground">Ready for the next draw</p>
            </CardContent>
            </Card>
        </motion.div>
      </div>

       <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
            <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.5 }}>
                 <Card>
                    <CardHeader>
                        <CardTitle>Capital Breakdown in Funds</CardTitle>
                        <CardDescription>
                            See how the total capital is distributed among the different funds.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? <div className="h-[300px] flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                            <ChartContainer config={fundChartConfig} className="h-[300px] w-full">
                                <BarChart accessibilityLayer data={data?.fundStats} layout="vertical" margin={{ right: 10 }}>
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
                        <CardTitle>Platform Growth Trend</CardTitle>
                        <CardDescription>
                            Chart of Total Value Locked (TVL) growth over time.
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
                    <CardTitle>You Are Our Growth Engine!</CardTitle>
                    <CardDescription>
                        At Trusva, your profit is directly tied to the community's growth. Every new investor makes the daily profit pool larger, which means more income for everyone!
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-foreground/90 mb-4">
                        By inviting your friends, you not only receive a **direct commission** from their first investment but also permanently contribute to **increasing your own daily profit**. It's a win-win situation.
                    </p>
                    <Button asChild>
                        <Link href="/dashboard/referrals">
                           <ArrowLeftRight className="w-4 h-4 mr-2"/>
                            Start Referring & Earning
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
