
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
import { getFundDetails, FundDetails } from "@/ai/flows/get-fund-details-flow";

const investmentSchema = z.object({
  amount: z.coerce.number().positive({ message: "مقدار باید مثبت باشد." }),
  transactionHash: z.string().min(10, { message: "لطفاً شناسه تراکنش معتبر وارد کنید." }),
});

type FundId = "usdt" | "bitcoin" | "gold" | "silver";

const fundIcons: Record<FundId, React.ReactNode> = {
    usdt: <DollarSign className="w-5 h-5 ml-2" />,
    bitcoin: <Bitcoin className="w-5 h-5 ml-2" />,
    gold: <Crown className="w-5 h-5 ml-2" />,
    silver: <Medal className="w-5 h-5 ml-2" />,
};


export default function InvestPage() {
  const { user } = useAuth();
  const [fundDetails, setFundDetails] = useState<FundDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFundId, setActiveFundId] = useState<FundId>("usdt");
  const { toast } = useToast();

  useEffect(() => {
    async function fetchDetails() {
      try {
        setLoading(true);
        const details = await getFundDetails();
        setFundDetails(details);
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
    fetchDetails();
  }, [toast]);

  const activeFund = fundDetails?.funds.find(f => f.id === activeFundId);

  const form = useForm<z.infer<typeof investmentSchema>>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      amount: 1,
      transactionHash: "",
    },
  });
  
  const watchedAmount = form.watch("amount", 1);
  const entryFee = watchedAmount * (fundDetails?.settings?.entryFee || 0) / 100;
  const lotteryFee = watchedAmount * (fundDetails?.settings?.lotteryFee || 0) / 100;
  const platformFee = watchedAmount * (fundDetails?.settings?.platformFee || 0) / 100;
  const totalFee = entryFee + lotteryFee + platformFee;
  const netInvestment = watchedAmount - totalFee;
  const netInvestmentUSD = netInvestment * (activeFund?.price.usd || 0);

  async function onSubmit(values: z.infer<typeof investmentSchema>) {
    if (!user || !activeFund) {
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
    if (!activeFund?.walletAddress) return;
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
  
  if (!fundDetails) {
    return <div className="text-center">اطلاعات صندوق‌ها یافت نشد.</div>
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
          <Tabs defaultValue={activeFundId} className="w-full" onValueChange={(value) => setActiveFundId(value as FundId)}>
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
              {fundDetails.funds.map((fund) => (
                <TabsTrigger key={fund.id} value={fund.id} className="py-2 flex flex-col sm:flex-row items-center gap-2">
                   {fundIcons[fund.id as FundId]} 
                   <div className="flex flex-col items-center sm:items-start">
                    <span>{fund.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      ${fund.price.usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                   </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {activeFund && (
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
                               <CardTitle className="text-lg">خلاصه مالی</CardTitle>
                             </CardHeader>
                             <CardContent className="space-y-4 text-sm">
                               <div className="flex justify-between items-center">
                                 <span className="text-muted-foreground">مبلغ سرمایه‌گذاری:</span>
                                 <span className="font-mono font-semibold">{watchedAmount.toFixed(4)} {activeFund.unit}</span>
                               </div>
                               <div className="flex justify-between items-center">
                                 <span className="text-muted-foreground">کارمزد ورود ({fundDetails.settings?.entryFee}%):</span>
                                 <span className={cn("font-mono font-semibold", watchedAmount > 0 && "text-red-500")}>-{entryFee.toFixed(4)} {activeFund.unit}</span>
                               </div>
                                <div className="flex justify-between items-center">
                                 <span className="text-muted-foreground">کارمزد قرعه‌کشی ({fundDetails.settings?.lotteryFee}%):</span>
                                 <span className={cn("font-mono font-semibold", watchedAmount > 0 && "text-red-500")}>-{lotteryFee.toFixed(4)} {activeFund.unit}</span>
                               </div>
                                <div className="flex justify-between items-center">
                                 <span className="text-muted-foreground">کارمزد پلتفرم ({fundDetails.settings?.platformFee}%):</span>
                                 <span className={cn("font-mono font-semibold", watchedAmount > 0 && "text-red-500")}>-{platformFee.toFixed(4)} {activeFund.unit}</span>
                               </div>
                               <hr />
                                <div className="flex justify-between items-center text-base">
                                 <span className="font-bold">سرمایه خالص شما:</span>
                                 <div className="flex flex-col items-end">
                                    <span className={cn("font-mono font-bold", netInvestment >= 0 ? "text-green-500" : "text-red-500")}>
                                        {netInvestment.toFixed(4)} {activeFund.unit}
                                    </span>
                                     <span className="text-xs text-muted-foreground font-mono">
                                        ~${netInvestmentUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                 </div>
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
            )}
           

          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
