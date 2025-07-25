
"use client";

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
import { Bar, BarChart, CartesianGrid, XAxis, Line, LineChart as RechartsLineChart } from "recharts";
import { DateRangePicker } from "@/components/date-range-picker";
import { FileDown, DollarSign, Users, Ticket, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const revenueChartData = [
  { date: "۱۴۰۳/۰۱", revenue: 4000 },
  { date: "۱۴۰۳/۰۲", revenue: 3000 },
  { date: "۱۴۰۳/۰۳", revenue: 2000 },
  { date: "۱۴۰۳/۰۴", revenue: 2780 },
  { date: "۱۴۰۳/۰۵", revenue: 1890 },
  { date: "۱۴۰۳/۰۶", revenue: 2390 },
];
const revenueChartConfig = {
  revenue: {
    label: "درآمد",
    color: "hsl(var(--primary))",
  },
};

const profitChartData = [
  { date: "۱۴۰۳/۰۱", profit: 2400 },
  { date: "۱۴۰۳/۰۲", profit: 1398 },
  { date: "۱۴۰۳/۰۳", profit: 9800 },
  { date: "۱۴۰۳/۰۴", profit: 3908 },
  { date: "۱۴۰۳/۰۵", profit: 4800 },
  { date: "۱۴۰۳/۰۶", profit: 3800 },
];
const profitChartConfig = {
  profit: {
    label: "سود",
    color: "hsl(var(--chart-2))",
  },
};

const financialEvents = [
  { id: "FEE-001", type: "کارمزد ورود", amount: 30.00, date: "۱۴۰۳/۰۴/۱۰", details: "سرمایه‌گذاری INV-005" },
  { id: "PAY-001", type: "پرداخت سود", amount: -1250.75, date: "۱۴۰۳/۰۴/۱۰", details: "توزیع سود روزانه" },
  { id: "FEE-002", type: "کارمزد خروج", amount: 20.00, date: "۱۴۰۳/۰۴/۰۹", details: "خروج از سرمایه INV-003" },
  { id: "LOT-001", type: "جایزه قرعه‌کشی", amount: -5000.00, date: "۱۴۰۳/۰۴/۰۱", details: "برنده: usr_4" },
  { id: "FEE-003", type: "کارمزد پلتفرم", amount: 10.00, date: "۱۴۰۳/۰۴/۰۸", details: "سرمایه‌گذاری INV-004" },
];


export default function AdminReportsPage() {
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
            <div className="text-2xl font-bold font-mono">$45,231.89</div>
            <p className="text-xs text-muted-foreground">
              +20.1% در ماه گذشته
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">سود پرداخت شده</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">$12,350.00</div>
            <p className="text-xs text-muted-foreground">
              +15.2% در ماه گذشته
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">موجودی صندوق قرعه‌کشی</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">$25,500.00</div>
            <p className="text-xs text-muted-foreground">
              +1,200.00 در این ماه
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کاربران جدید (ماهانه)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2,350</div>
            <p className="text-xs text-muted-foreground">
              +180.1% در ۳۰ روز گذشته
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:gap-8">
        <Card>
            <CardHeader>
                <CardTitle>نمودار درآمد کارمزدها</CardTitle>
                <CardDescription>نمایش روند درآمد ماهانه از کارمزدها.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={revenueChartConfig} className="h-[250px] w-full">
                  <BarChart accessibilityLayer data={revenueChartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={8} />
                  </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>نمودار سود پرداخت شده</CardTitle>
                <CardDescription>نمایش روند پرداخت سود ماهانه به کاربران.</CardDescription>
            </CardHeader>
            <CardContent>
                 <ChartContainer config={profitChartConfig} className="h-[250px] w-full">
                    <RechartsLineChart
                        accessibilityLayer
                        data={profitChartData}
                        margin={{ top: 5, right: 20, left: -10, bottom: 0 }}
                        >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                        />
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
                        {financialEvents.map((event) => (
                            <TableRow key={event.id}>
                                <TableCell className="font-mono">{event.id}</TableCell>
                                <TableCell>
                                     <Badge variant={event.amount > 0 ? "secondary" : "destructive"}>
                                        {event.type}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{event.details}</TableCell>
                                <TableCell>{event.date}</TableCell>
                                <TableCell className={`text-right font-mono ${event.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {event.amount > 0 ? '+' : ''}${Math.abs(event.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
             <CardFooter>
                <div className="text-xs text-muted-foreground">
                    نمایش <strong>۱-۵</strong> از <strong>{financialEvents.length}</strong> رویداد مالی
                </div>
            </CardFooter>
       </Card>
    </>
  );
}
