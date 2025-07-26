
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
import { useToast } from "@/hooks/use-toast";
import { Percent, Globe, AlertTriangle, KeyRound, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getPlatformSettings, updatePlatformSettings, PlatformSettings } from "@/ai/flows/platform-settings-flow";

const settingsSchema = z.object({
  entryFee: z.coerce.number().min(0).max(100),
  lotteryFee: z.coerce.number().min(0).max(100),
  platformFee: z.coerce.number().min(0).max(100),
  exitFee: z.coerce.number().min(0).max(100),
  maintenanceMode: z.boolean(),
  // Wallet Addresses
  goldWalletAddress: z.string().min(1, "آدرس کیف پول طلا الزامی است."),
  silverWalletAddress: z.string().min(1, "آدرس کیف پول نقره الزامی است."),
  usdtWalletAddress: z.string().min(1, "آدرس کیف پول USDT الزامی است."),
  bitcoinWalletAddress: z.string().min(1, "آدرس کیف پول بیت‌کوین الزامی است."),
});

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
      maintenanceMode: false,
      goldWalletAddress: "",
      silverWalletAddress: "",
      usdtWalletAddress: "",
      bitcoinWalletAddress: "",
    },
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const settings = await getPlatformSettings();
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
        await updatePlatformSettings(values);
        toast({
            title: "تنظیمات ذخیره شد",
            description: "تنظیمات جدید پلتفرم با موفقیت اعمال شد.",
        });
    } catch (error) {
         toast({
            variant: "destructive",
            title: "خطا در ذخیره تنظیمات",
            description: "مشکلی در ذخیره تنظیمات جدید رخ داد.",
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
                    <CardTitle>مدیریت کارمزدها</CardTitle>
                    <CardDescription>
                    درصدهای کارمزد را برای عملیات مختلف در پلتفرم تنظیم کنید.
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
                        <CardTitle>وضعیت سیستم</CardTitle>
                        <CardDescription>تنظیمات کلی و وضعیت عملیاتی پلتفرم.</CardDescription>
                    </CardHeader>
                    <CardContent>
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
