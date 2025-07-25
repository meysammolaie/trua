
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
  CardFooter,
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
import { Globe, AlertTriangle, KeyRound, Percent } from "lucide-react";

const settingsSchema = z.object({
  entryFee: z.coerce.number().min(0).max(100),
  lotteryFee: z.coerce.number().min(0).max(100),
  platformFee: z.coerce.number().min(0).max(100),
  exitFee: z.coerce.number().min(0).max(100),
  maintenanceMode: z.boolean(),
  coinbaseApiKey: z.string().optional(),
  blockchainNodeUrl: z.string().url().optional().or(z.literal('')),
});

export default function AdminSettingsPage() {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    // مقادیر پیش‌فرض برای نمایش
    defaultValues: {
      entryFee: 3,
      lotteryFee: 2,
      platformFee: 1,
      exitFee: 2,
      maintenanceMode: false,
      coinbaseApiKey: "********", 
      blockchainNodeUrl: "https://mainnet.infura.io/v3/...",
    },
  });

  function onSubmit(values: z.infer<typeof settingsSchema>) {
    console.log(values);
    toast({
      title: "تنظیمات ذخیره شد",
      description: "تنظیمات جدید پلتفرم با موفقیت اعمال شد.",
    });
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">تنظیمات پلتفرم</h1>
      </div>
       <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-6">
                {/* Fee Management Card */}
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

                {/* System Status & API Card */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>وضعیت سیستم</CardTitle>
                             <CardDescription>
                                تنظیمات کلی و وضعیت عملیاتی پلتفرم.
                             </CardDescription>
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

                     <Card>
                        <CardHeader>
                            <CardTitle>APIها و یکپارچه‌سازی</CardTitle>
                             <CardDescription>
                                کلیدهای API و اتصالات سرویس‌های خارجی را مدیریت کنید.
                             </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="coinbaseApiKey"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>کلید API کوین‌بیس</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="blockchainNodeUrl"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>آدرس نود بلاکچین</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                </div>
                 <div className="flex justify-end">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                         {form.formState.isSubmitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
                    </Button>
                </div>
            </div>
        </form>
      </Form>
    </>
  );
}

