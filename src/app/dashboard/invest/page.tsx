
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Bitcoin, Crown, DollarSign, Medal, Copy, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { submitInvestment } from "@/ai/flows/investment-flow";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { getPlatformSettings, PlatformSettings } from "@/ai/flows/platform-settings-flow";

const investmentSchema = z.object({
  amount: z.coerce.number().positive({ message: "مقدار باید مثبت باشد." }),
  transactionHash: z.string().min(10, { message: "لطفاً شناسه تراکنش معتبر وارد کنید." }),
});

type FundId = "usdt" | "bitcoin" | "gold" | "silver";

type Fund = {
  id: FundId;
  name: string;
  icon: React.ReactNode;
  unit: string;
  walletAddress: string;
};

export default function InvestPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFundId, setActiveFundId] = useState<FundId>("usdt");
  const { toast } = useToast();

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const platformSettings = await getPlatformSettings();
        setSettings(platformSettings);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "خطا",
          description: "خطایی در بارگذاری اطلاعات صندوق‌ها رخ داد.",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [toast]);

  const funds: Fund[] = [
    { id: "usdt", name: "صندوق تتر", icon: <DollarSign className="w-5 h-5 ml-2" />, unit: "USDT", walletAddress: settings?.usdtWalletAddress || '' },
    { id: "bitcoin", name: "صندوق بیت‌کوین", icon: <Bitcoin className="w-5 h-5 ml-2" />, unit: "BTC", walletAddress: settings?.bitcoinWalletAddress || '' },
    { id: "gold", name: "صندوق طلا", icon: <Crown className="w-5 h-5 ml-2" />, unit: "PAXG", walletAddress: settings?.goldWalletAddress || '' },
    { id: "silver", name: "صندوق نقره", icon: <Medal className="w-5 h-5 ml-2" />, unit: "KAG", walletAddress: settings?.silverWalletAddress || '' },
  ];

  const activeFund = funds.find(f => f.id === activeFundId)!;

  const form = useForm<z.infer<typeof investmentSchema>>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      amount: 1,
      transactionHash: "",
    },
  });
  
  const watchedAmount = form.watch("amount", 1);
  const entryFee = watchedAmount * (settings?.entryFee || 0) / 100;
  const lotteryFee = watchedAmount * (settings?.lotteryFee || 0) / 100;
  const platformFee = watchedAmount * (settings?.platformFee || 0) / 100;
  const totalFee = entryFee + lotteryFee + platformFee;
  const netInvestment = watchedAmount - totalFee;

  async function onSubmit(values: z.infer<typeof investmentSchema>) {
    if (!user) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "برای ثبت سرمایه‌گذاری باید ابتدا وارد شوید.",
      });
      return;
    }
    if (values.amount < 1) {
        form.setError("amount", { message: `حداقل سرمایه‌گذاری ۱ ${activeFund.unit} است.` });
        return;
    }

    try {
      const result = await submitInvestment({
        userId: user.uid,
        fundId: activeFund.id,
        amount: values.amount,
        transactionHash: values.transactionHash,
      });

      if (result.success) {
        toast({
          title: "درخواست شما ثبت شد",
          description: result.message,
        });
        form.reset({ amount: 1, transactionHash: "" });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطا در ثبت سرمایه‌گذاری",
        description: error instanceof Error ? error.message : "مشکلی پیش آمده است.",
      });
    }
  }

  const handleCopyToClipboard = () => {
    if (!activeFund.walletAddress) return;
    navigator.clipboard.writeText(activeFund.walletAddress);
    toast({
      title: "کپی شد!",
      description: "آدرس کیف پول در کلیپ‌بورد شما کپی شد.",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="mr-4">در حال بارگذاری فرم سرمایه‌گذاری...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">سرمایه‌گذاری</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>ایجاد سرمایه‌گذاری جدید</CardTitle>
          <CardDescription>
            صندوق مورد نظر خود را انتخاب کرده و فرآیند سرمایه‌گذاری را آغاز کنید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={activeFund.id} className="w-full" onValueChange={(value) => setActiveFundId(value as FundId)}>
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
              {funds.map((fund) => (
                <TabsTrigger key={fund.id} value={fund.id} className="py-2">
                   {fund.icon} {fund.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-6">
                <TabsContent value={activeFund.id} className="m-0">
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Column 1: Investment Details */}
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>مقدار سرمایه‌گذاری ({activeFund.unit})</FormLabel>
                            <FormControl>
                              <Input type="number" step="any" {...field} />
                            </FormControl>
                            <FormDescription>
                              حداقل مقدار: ۱ {activeFund.unit}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div>
                        <Label>آدرس کیف پول پلتفرم ({activeFund.unit})</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <Input readOnly value={activeFund.walletAddress} className="text-left" dir="ltr" />
                          <Button type="button" variant="outline" size="icon" onClick={handleCopyToClipboard} disabled={!activeFund.walletAddress}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          مقدار ({activeFund.unit}) را به این آدرس واریز کرده و سپس شناسه تراکنش را در فرم زیر وارد کنید.
                        </p>
                      </div>

                       <FormField
                        control={form.control}
                        name="transactionHash"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>شناسه تراکنش (TxID)</FormLabel>
                            <FormControl>
                              <Input placeholder="0x..." {...field} className="text-left" dir="ltr" />
                            </FormControl>
                             <FormDescription>
                              شناسه تراکنش را پس از واریز در اینجا وارد کنید.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Column 2: Fee Summary */}
                    <div className="space-y-4">
                       <Card className="bg-muted/50">
                          <CardHeader>
                            <CardTitle className="text-lg">خلاصه مالی ({activeFund.unit})</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">مبلغ سرمایه‌گذاری:</span>
                              <span className="font-mono font-semibold">{watchedAmount.toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">کارمزد ورود ({settings?.entryFee}%):</span>
                              <span className={cn("font-mono font-semibold", watchedAmount > 0 && "text-red-500")}>-{entryFee.toFixed(4)}</span>
                            </div>
                             <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">کارمزد قرعه‌کشی ({settings?.lotteryFee}%):</span>
                              <span className={cn("font-mono font-semibold", watchedAmount > 0 && "text-red-500")}>-{lotteryFee.toFixed(4)}</span>
                            </div>
                             <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">کارمزد پلتفرم ({settings?.platformFee}%):</span>
                              <span className={cn("font-mono font-semibold", watchedAmount > 0 && "text-red-500")}>-{platformFee.toFixed(4)}</span>
                            </div>
                            <hr />
                             <div className="flex justify-between items-center text-base">
                              <span className="font-bold">سرمایه خالص شما:</span>
                              <span className={cn("font-mono font-bold", netInvestment >= 0 ? "text-green-500" : "text-red-500")}>
                                {netInvestment.toFixed(4)}
                              </span>
                            </div>
                          </CardContent>
                       </Card>
                       <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || !activeFund.walletAddress}>
                         {form.formState.isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                         {form.formState.isSubmitting ? "در حال ثبت..." : "ثبت سرمایه‌گذاری"}
                       </Button>
                    </div>
                  </div>
                </TabsContent>
              </form>
            </Form>

          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
