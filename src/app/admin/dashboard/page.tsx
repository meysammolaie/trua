
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Users, Package, Activity, AlertCircle } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">داشبورد مدیریت</h1>
      </div>
       <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل سرمایه در گردش</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,245,231.89</div>
            <p className="text-xs text-muted-foreground">
              +5.2% در ۲۴ ساعت گذشته
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کاربران فعال</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2,350</div>
            <p className="text-xs text-muted-foreground">
              +180 در ماه گذشته
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">سرمایه‌گذاری‌های فعال</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12,234</div>
            <p className="text-xs text-muted-foreground">
              +502 در ماه گذشته
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تراکنش‌های در انتظار</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">57</div>
            <p className="text-xs text-muted-foreground">
              نیاز به بررسی دارد
            </p>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
            <Card className="xl:col-span-2">
                <CardHeader>
                    <CardTitle>فعالیت‌های اخیر</CardTitle>
                    <CardDescription>
                       نمایش آخرین رویدادهای مهم در پلتفرم.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Placeholder for recent activities feed */}
                    <div className="flex items-center gap-4 p-2 rounded-lg bg-muted/50">
                        <Users className="h-5 w-5 text-green-500" />
                        <p className="text-sm">کاربر جدید <span className="font-semibold">john.doe@example.com</span> ثبت‌نام کرد.</p>
                        <span className="ml-auto text-xs text-muted-foreground">۲ دقیقه پیش</span>
                    </div>
                     <div className="flex items-center gap-4 p-2 mt-2 rounded-lg bg-muted/50">
                        <DollarSign className="h-5 w-5 text-blue-500" />
                        <p className="text-sm">سرمایه‌گذاری به مبلغ <span className="font-semibold">$5,000</span> در صندوق بیت‌کوین ثبت شد.</p>
                        <span className="ml-auto text-xs text-muted-foreground">۱۰ دقیقه پیش</span>
                    </div>
                     <div className="flex items-center gap-4 p-2 mt-2 rounded-lg bg-muted/50">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <p className="text-sm">تراکنش <span className="font-mono">0x...1234</span> به دلیل عدم تطابق ناموفق بود.</p>
                        <span className="ml-auto text-xs text-muted-foreground">۱ ساعت پیش</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>سلامت سیستم</CardTitle>
                     <CardDescription>
                       وضعیت سرویس‌های اصلی پلتفرم.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                   <div className="flex items-center justify-between">
                       <span className="text-sm font-medium">سرویس احراز هویت</span>
                       <span className="text-sm font-semibold text-green-600">فعال</span>
                   </div>
                    <div className="flex items-center justify-between">
                       <span className="text-sm font-medium">پردازش تراکنش‌ها</span>
                       <span className="text-sm font-semibold text-green-600">فعال</span>
                   </div>
                    <div className="flex items-center justify-between">
                       <span className="text-sm font-medium">سرویس سوددهی روزانه</span>
                       <span className="text-sm font-semibold text-yellow-500">در حال پردازش</span>
                   </div>
                   <div className="flex items-center justify-between">
                       <span className="text-sm font-medium">ارتباط با نود بلاکچین</span>
                       <span className="text-sm font-semibold text-red-500">قطع شده</span>
                   </div>
                </CardContent>
            </Card>
       </div>
    </>
  );
}
