
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
import { Bitcoin, Crown, DollarSign, Landmark, Medal, Copy, TrendingUp, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { submitInvestment } from "@/ai/flows/investment-flow";
import { cn } from "@/lib/utils";

const investmentSchema = z.object({
  amount: z.coerce.number().positive({ message: "مقدار باید مثبت باشد." }),
  transactionHash: z.string().min(10, { message: "لطفاً شناسه تراکنش معتبر وارد کنید." }),
});

type Fund = {
  id: "gold" | "silver" | "dollar" | "bitcoin";
  name: string;
  icon: React.ReactNode;
  walletAddress: string;
  unit: string;
  price: number;
};

export default function InvestPage() {
  const [prices, setPrices] = useState({
    gold: 75.50, // per gram
    silver: 0.95, // per gram
    bitcoin: 65000.00,
  });
  const [activeFundId, setActiveFundId] = useState<Fund["id"]>("gold");
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prevPrices => ({
        gold: prevPrices.gold * (1 + (Math.random() - 0.5) * 0.01),
        silver: prevPrices.silver * (1 + (Math.random() - 0.5) * 0.01),
        bitcoin: prevPrices.bitcoin * (1 + (Math.random() - 0.5) * 0.02),
      }));
    }, 3000); // Update prices every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const funds: Fund[] = [
    { id: "gold", name: "صندوق طلا", icon: <Crown className="w-5 h-5 ml-2" />, walletAddress: "0xAddressGold...SAMPLE...", unit: "گرم", price: prices.gold },
    { id: "silver", name: "صندوق نقره", icon: <Medal className="w-5 h-5 ml-2" />, walletAddress: "0xAddressSilver...SAMPLE...", unit: "گرم", price: prices.silver },
    { id: "dollar", name: "صندوق دلار", icon: <DollarSign className="w-5 h-5 ml-2" />, walletAddress: "0xAddressDollar...SAMPLE...", unit: "دلار", price: 1 },
    { id: "bitcoin", name: "صندوق بیت‌کوین", icon: <Bitcoin className="w-5 h-5 ml-2" />, walletAddress: "bc1qAddressBitcoin...SAMPLE...", unit: "BTC", price: prices.bitcoin },
  ];

  const activeFund = funds.find(f => f.id === activeFundId)!;
  const minInvestmentUnit = 1 / activeFund.price;

  const form = useForm<z.infer<typeof investmentSchema>>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      amount: minInvestmentUnit,
      transactionHash: "",
    },
  });
  
  useEffect(() => {
     form.setValue("amount", minInvestmentUnit);
  }, [activeFundId, form, minInvestmentUnit]);

  const watchAmount = form.watch("amount", minInvestmentUnit);
  const amountInUsd = watchAmount * activeFund.price;

  const entryFee = amountInUsd * 0.03;
  const lotteryFee = amountInUsd * 0.02;
  const platformFee = amountInUsd * 0.01;
  const totalFee = entryFee + lotteryFee + platformFee;
  const netInvestment = amountInUsd - totalFee;

  async function onSubmit(values: z.infer<typeof investmentSchema>) {
    if (amountInUsd < 1) {
        form.setError("amount", { message: `حداقل سرمایه‌گذاری معادل ۱ دلار است.` });
        return;
    }

    try {
      const result = await submitInvestment({
        fundId: activeFund.id,
        amount: amountInUsd,
        transactionHash: values.transactionHash,
      });

      if (result.success) {
        toast({
          title: "درخواست شما ثبت شد",
          description: result.message,
        });
        form.reset();
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
    navigator.clipboard.writeText(activeFund.walletAddress);
    toast({
      title: "کپی شد!",
      description: "آدرس کیف پول در کلیپ‌بورد شما کپی شد.",
    });
  };

  return (
    <>
       <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">سرمایه‌گذاری</h1>
      </div>
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {funds.filter(f => f.id !== 'dollar').map(fund => (
          <Card key={fund.id} className="text-center">
            <CardHeader className="p-4 flex-row items-center justify-center gap-2">
                {fund.icon}
                <CardTitle className="text-md">{fund.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <p className="text-lg font-bold font-mono">${fund.price.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">قیمت هر {fund.unit}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>ایجاد سرمایه‌گذاری جدید</CardTitle>
          <CardDescription>
            صندوق مورد نظر خود را انتخاب کرده و فرآیند سرمایه‌گذاری را آغاز کنید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={activeFund.id} className="w-full" onValueChange={(value) => setActiveFundId(value as Fund["id"])}>
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
                              حداقل مقدار: ~{minInvestmentUnit.toFixed(6)} {activeFund.unit} (معادل ۱ دلار)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div>
                        <Label>آدرس کیف پول پلتفرم ({activeFund.name})</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <Input readOnly value={activeFund.walletAddress} className="text-left" />
                          <Button type="button" variant="outline" size="icon" onClick={handleCopyToClipboard}>
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
                              <Input placeholder="0x..." {...field} className="text-left" />
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
                            <CardTitle className="text-lg">خلاصه مالی</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">ارزش دلاری سرمایه‌گذاری:</span>
                              <span className="font-mono font-semibold">${amountInUsd.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">کارمزد ورود (۳٪):</span>
                              <span className={cn("font-mono font-semibold", amountInUsd > 0 && "text-red-500")}>-${entryFee.toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">کارمزد قرعه‌کشی (۲٪):</span>
                              <span className={cn("font-mono font-semibold", amountInUsd > 0 && "text-red-500")}>-${lotteryFee.toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">کارمزد پلتفرم (۱٪):</span>
                              <span className={cn("font-mono font-semibold", amountInUsd > 0 && "text-red-500")}>-${platformFee.toFixed(2)}</span>
                            </div>
                            <hr />
                             <div className="flex justify-between items-center text-base">
                              <span className="font-bold">سرمایه خالص شما:</span>
                              <span className={cn("font-mono font-bold", netInvestment >= 0 ? "text-green-500" : "text-red-500")}>
                                ${netInvestment.toFixed(2)}
                              </span>
                            </div>
                          </CardContent>
                       </Card>
                       <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
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
