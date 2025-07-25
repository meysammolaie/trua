
"use client";

import {
  Activity,
  ArrowUpRight,
  Bitcoin,
  CircleUser,
  CreditCard,
  Crown,
  DollarSign,
  Landmark,
  Medal,
  Menu,
  Package2,
  Search,
  Users,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
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
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";

const chartData = [
  { month: "فروردین", desktop: 186, mobile: 80 },
  { month: "اردیبهشت", desktop: 305, mobile: 200 },
  { month: "خرداد", desktop: 237, mobile: 120 },
  { month: "تیر", desktop: 73, mobile: 190 },
  { month: "مرداد", desktop: 209, mobile: 130 },
  { month: "شهریور", desktop: 214, mobile: 140 },
];
const chartConfig = {
  desktop: {
    label: "رشد",
    color: "hsl(var(--primary))",
  },
};

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
                <div className="text-2xl font-bold">$45,231.89</div>
                <p className="text-xs text-muted-foreground">
                +20.1% نسبت به ماه گذشته
                </p>
            </CardContent>
            </Card>
        </motion.div>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">سود کل</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">$2,350.00</div>
                <p className="text-xs text-muted-foreground">
                +180.1% نسبت به ماه گذشته
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
                <div className="text-2xl font-bold">$12,234.00</div>
                <p className="text-xs text-muted-foreground">
                +19% نسبت به ماه گذشته
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
                +21 از آخرین قرعه‌کشی
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
                    <Bar dataKey="desktop" fill="var(--color-desktop)" radius={8} />
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
                                <Button size="sm">سرمایه‌گذاری</Button>
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
                    <TableHead>کاربر</TableHead>
                    <TableHead className="text-left">نوع</TableHead>
                    <TableHead className="text-left">وضعیت</TableHead>
                    <TableHead className="text-left">تاریخ</TableHead>
                    <TableHead className="text-right">مبلغ</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                    <TableCell>
                        <div className="font-medium">Liam Johnson</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">
                        liam@example.com
                        </div>
                    </TableCell>
                    <TableCell className="text-left">واریز</TableCell>
                    <TableCell className="text-left">
                        <Badge className="text-xs" variant="outline">
                        موفق
                        </Badge>
                    </TableCell>
                    <TableCell className="text-left">
                        2023-06-23
                    </TableCell>
                    <TableCell className="text-right">$250.00</TableCell>
                    </TableRow>
                    <TableRow>
                    <TableCell>
                        <div className="font-medium">Olivia Smith</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">
                        olivia@example.com
                        </div>
                    </TableCell>
                    <TableCell className="text-left">برداشت</TableCell>
                    <TableCell className="text-left">
                        <Badge className="text-xs" variant="outline">
                        در حال انجام
                        </Badge>
                    </TableCell>
                    <TableCell className="text-left">
                        2023-06-24
                    </TableCell>
                    <TableCell className="text-right">$150.00</TableCell>
                    </TableRow>
                    <TableRow>
                    <TableCell>
                        <div className="font-medium">Noah Williams</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">
                        noah@example.com
                        </div>
                    </TableCell>
                    <TableCell className="text-left">سود روزانه</TableCell>
                    <TableCell className="text-left">
                        <Badge className="text-xs" variant="outline">
                        موفق
                        </Badge>
                    </TableCell>
                    <TableCell className="text-left">
                        2023-06-25
                    </TableCell>
                    <TableCell className="text-right">$32.50</TableCell>
                    </TableRow>
                    <TableRow>
                    <TableCell>
                        <div className="font-medium">Emma Brown</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">
                        emma@example.com
                        </div>
                    </TableCell>
                    <TableCell className="text-left">واریز</TableCell>
                    <TableCell className="text-left">
                        <Badge className="text-xs" variant="destructive">
                        ناموفق
                        </Badge>
                    </TableCell>
                    <TableCell className="text-left">
                        2023-06-26
                    </TableCell>
                    <TableCell className="text-right">$450.00</TableCell>
                    </TableRow>
                </TableBody>
                </Table>
            </CardContent>
            </Card>
        </motion.div>
      </div>
    </>
  );
}
