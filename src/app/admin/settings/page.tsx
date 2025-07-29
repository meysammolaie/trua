
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
    saturday: 'Saturday',
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday'
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
          title: "Error Loading Settings",
          description: "There was a problem retrieving the current platform settings.",
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
                title: "Settings Saved",
                description: "The new platform settings have been applied successfully.",
            });
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Error Saving Settings",
            description: error instanceof Error ? error.message : "There was a problem saving the new settings.",
        });
    }
  }

  if (loading) {
    return (
        <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="ml-4">Loading settings...</p>
        </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Platform Settings</h1>
      </div>
       <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-6">
                <Card>
                <CardHeader>
                    <CardTitle>Fee & Withdrawal Management</CardTitle>
                    <CardDescription>
                    Configure the platform's financial rules like fees and withdrawal conditions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <FormField
                    control={form.control}
                    name="entryFee"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Entry Fee</FormLabel>
                         <div className="relative">
                            <Input type="number" {...field} className="pl-8" />
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
                        <FormLabel>Lottery Fee</FormLabel>
                        <div className="relative">
                            <Input type="number" {...field} className="pl-8" />
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
                        <FormLabel>Exit Fee</FormLabel>
                        <div className="relative">
                            <Input type="number" {...field} className="pl-8" />
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
                        <FormLabel>Platform Fee</FormLabel>
                        <div className="relative">
                            <Input type="number" {...field} className="pl-8" />
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
                            <FormLabel>Minimum Withdrawal Amount</FormLabel>
                            <div className="relative">
                                <Input type="number" {...field} className="pl-8" />
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
                                <FormLabel>Allowed Withdrawal Day</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                             <CalendarDays className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <SelectValue placeholder="Select a day" className="pl-8"/>
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
                            <FormLabel>Network Fee for Withdrawal</FormLabel>
                            <div className="relative">
                                <Input type="number" {...field} className="pl-8" />
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
                        <CardTitle>Wallet Management</CardTitle>
                        <CardDescription>Set up wallet addresses for user deposits.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <FormField
                            control={form.control}
                            name="usdtWalletAddress"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>USDT Wallet Address</FormLabel>
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
                                <FormLabel>Bitcoin (BTC) Wallet Address</FormLabel>
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
                                <FormLabel>Gold (e.g., PAXG) Wallet Address</FormLabel>
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
                                <FormLabel>Silver (e.g., KAG) Wallet Address</FormLabel>
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
                        <CardTitle>System Settings</CardTitle>
                        <CardDescription>General platform settings and operational status.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <FormField
                            control={form.control}
                            name="maintenanceMode"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Maintenance Mode</FormLabel>
                                        <FormDescription>
                                            By activating this option, the site will be inaccessible to users.
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
                                <FormLabel>Bonus Unlock Target ($)</FormLabel>
                                <div className="relative">
                                    <Input type="number" {...field} className="pl-8" />
                                    <Target className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                </div>
                                <FormDescription>
                                   The total platform TVL at which user bonuses will be unlocked.
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
                                        <FormLabel className="text-base">Automatic Daily Profit Distribution</FormLabel>
                                        <FormDescription>
                                            If enabled, profits will be distributed automatically every night.
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
                         {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                         {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        </form>
      </Form>
    </>
  );
}
