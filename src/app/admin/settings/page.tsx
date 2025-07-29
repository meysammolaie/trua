
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Percent, Globe, AlertTriangle, KeyRound, Loader2, DollarSign, CalendarDays, Network, Target, Bot } from "lucide-react";
import { useEffect, useState } from "react";
import { getPlatformSettingsAction, updatePlatformSettingsAction } from "@/app/actions/platform-settings";
import { PlatformSettingsSchema } from "@/ai/schemas";
import type { PlatformSettings } from "@/ai/flows/platform-settings-flow";


const settingsSchema = PlatformSettingsSchema;

const dayNames = {
    saturday: 'شنبه',
    sunday: 'یکشنبه',
    monday: 'دوشنبه',
    tuesday: 'سه‌شنبه',
    wednesday: 'چهارشنبه',
    thursday: 'پنج‌شنبه',
    friday: 'جمعه'
};

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      entryFee: 3,
      lotteryFee: 2,
      platformFee: 1,
      exitFee: 2,
      networkFee: 1,
      maintenanceMode: false,
      goldWalletAddress: "",
      silverWalletAddress: "",
      usdtWalletAddress: "",
      bitcoinWalletAddress: "",
      minWithdrawalAmount: 10,
      withdrawalDay: "saturday",
      bonusUnlockTarget: 1000000,
      automaticProfitDistribution: true,
      lastDistributionAt: null,
    },
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const settings = await getPlatformSettingsAction();
        if (settings) {
          form.reset(settings);
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "خطا در بارگذاری تنظیمات",
          description: "مشکلی در دریافت تنظیمات فعلی پلتفرم رخ داد.",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [form, toast]);


  async function onSubmit(values: z.infer<typeof settingsSchema>) {
    try {
        const result = await updatePlatformSettingsAction(values);
        if (result.success) {
            toast({
                title: "تنظیمات ذخیره شد",
                description: "تنظیمات جدید پلتفرم با موفقیت اعمال شد.",
            });
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
         toast({
            variant: "destructive",
            title: "خطا در ذخیره تنظیمات",
            description: error instanceof Error ? error.message : "مشکلی در ذخیره تنظیمات جدید رخ داد.",
        });
    }
  }

  if (loading) {
    return (
        <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="mr-4">در حال بارگذاری تنظیمات...</p>
        </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">تنظیمات پلتفرم</h1>
      </div>
       <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-6">
                <Card>
                <CardHeader>
                    <CardTitle>مدیریت کارمزدها و برداشت</CardTitle>
                    <CardDescription>
                    قوانین مالی پلتفرم مانند کارمزدها و شرایط برداشت را تنظیم کنید.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <FormField
                    control={form.control}
                    name="entryFee"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>کارمزد ورود</FormLabel>
                         <div className="relative">
                            <Input type="number" {...field} className="pr-8" />
                            <Percent className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                         </div>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="lotteryFee"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>کارمزد قرعه‌کشی</FormLabel>
                        <div className="relative">
                            <Input type="number" {...field} className="pr-8" />
                            <Percent className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                         </div>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={form.control}
                    name="exitFee"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>کارمزد خروج</FormLabel>
                        <div className="relative">
                            <Input type="number" {...field} className="pr-8" />
                            <Percent className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                         </div>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={form.control}
                    name="platformFee"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>کارمزد پلتفرم</FormLabel>
                        <div className="relative">
                            <Input type="number" {...field} className="pr-8" />
                            <Percent className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                         </div>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                        control={form.control}
                        name="minWithdrawalAmount"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>حداقل مبلغ برداشت</FormLabel>
                            <div className="relative">
                                <Input type="number" {...field} className="pr-8" />
                                <DollarSign className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="withdrawalDay"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>روز مجاز برداشت</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                             <CalendarDays className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <SelectValue placeholder="یک روز را انتخاب کنید" className="pr-8"/>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                       {Object.entries(dayNames).map(([value, name]) => (
                                           <SelectItem key={value} value={value}>{name}</SelectItem>
                                       ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name="networkFee"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>کارمزد شبکه برای برداشت</FormLabel>
                            <div className="relative">
                                <Input type="number" {...field} className="pr-8" />
                                <Network className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>مدیریت کیف پول‌ها</CardTitle>
                        <CardDescription>آدرس‌های کیف پول برای واریز کاربران را تنظیم کنید.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                         <FormField
                            control={form.control}
                            name="usdtWalletAddress"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>آدرس کیف پول تتر (USDT)</FormLabel>
                                <FormControl>
                                    <Input {...field} dir="ltr" />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="bitcoinWalletAddress"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>آدرس کیف پول بیت‌کوین (BTC)</FormLabel>
                                <FormControl>
                                    <Input {...field} dir="ltr" />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="goldWalletAddress"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>آدرس کیف پول طلا (مثلاً PAXG)</FormLabel>
                                <FormControl>
                                    <Input {...field} dir="ltr" />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="silverWalletAddress"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>آدرس کیف پول نقره (مثلاً KAG)</FormLabel>
                                <FormControl>
                                    <Input {...field} dir="ltr" />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>تنظیمات سیستم</CardTitle>
                        <CardDescription>تنظیمات کلی و وضعیت عملیاتی پلتفرم.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                         <FormField
                            control={form.control}
                            name="maintenanceMode"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">حالت تعمیر و نگهداری</FormLabel>
                                        <FormDescription>
                                            با فعال‌سازی این گزینه، سایت برای کاربران غیرقابل دسترس خواهد شد.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="bonusUnlockTarget"
                            render={({ field }) => (
                                <FormItem className="rounded-lg border p-4">
                                <FormLabel>هدف آزادسازی جایزه (دلار)</FormLabel>
                                <div className="relative">
                                    <Input type="number" {...field} className="pr-8" />
                                    <Target className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                </div>
                                <FormDescription>
                                   مبلغ کل TVL پلتفرم که پس از رسیدن به آن، جوایز کاربران آزاد می‌شود.
                                </FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="automaticProfitDistribution"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">توزیع خودکار سود روزانه</FormLabel>
                                        <FormDescription>
                                            با فعال‌سازی این گزینه، سودها هر شب به صورت خودکار توزیع می‌شوند.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
                
                 <div className="flex justify-end">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                         {form.formState.isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                         {form.formState.isSubmitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
                    </Button>
                </div>
            </div>
        </form>
      </Form>
    </>
  );
}
