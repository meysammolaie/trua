
"use client";

import { useState } from "react";
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
import { Bitcoin, Crown, DollarSign, Landmark, Medal, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { submitInvestment } from "@/ai/flows/investment-flow";

const funds = [
  { id: "gold", name: "صندوق طلا", icon: <Crown className="w-5 h-5 ml-2" />, walletAddress: "0xAddressGold...SAMPLE..." },
  { id: "silver", name: "صندوق نقره", icon: <Medal className="w-5 h-5 ml-2" />, walletAddress: "0xAddressSilver...SAMPLE..." },
  { id: "dollar", name: "صندوق دلار", icon: <DollarSign className="w-5 h-5 ml-2" />, walletAddress: "0xAddressDollar...SAMPLE..." },
  { id: "bitcoin", name: "صندوق بیت‌کوین", icon: <Bitcoin className="w-5 h-5 ml-2" />, walletAddress: "bc1qAddressBitcoin...SAMPLE..." },
];

const investmentSchema = z.object({
  amount: z.coerce.number().min(1, { message: "حداقل مبلغ سرمایه‌گذاری ۱ دلار است." }),
  transactionHash: z.string().min(10, { message: "لطفاً شناسه تراکنش معتبر وارد کنید." }),
});

export default function InvestPage() {
  const [activeFund, setActiveFund] = useState(funds[0]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof investmentSchema>>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      amount: 1,
      transactionHash: "",
    },
  });

  const watchAmount = form.watch("amount", 1);
  const entryFee = watchAmount * 0.03;
  const lotteryFee = watchAmount * 0.02;
  const platformFee = watchAmount * 0.01;
  const totalFee = entryFee + lotteryFee + platformFee;
  const netInvestment = watchAmount - totalFee;

  async function onSubmit(values: z.infer<typeof investmentSchema>) {
    try {
      const result = await submitInvestment({
        fundId: activeFund.id,
        amount: values.amount,
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
      <Card>
        <CardHeader>
          <CardTitle>ایجاد سرمایه‌گذاری جدید</CardTitle>
          <CardDescription>
            صندوق مورد نظر خود را انتخاب کرده و فرآیند سرمایه‌گذاری را آغاز کنید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={activeFund.id} className="w-full" onValueChange={(value) => setActiveFund(funds.find(f => f.id === value) || funds[0])}>
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
                            <FormLabel>مبلغ سرمایه‌گذاری (دلار)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                              حداقل مبلغ برای شروع ۱ دلار است.
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
                          مبلغ مورد نظر را به این آدرس واریز کرده و سپس شناسه تراکنش را در فرم زیر وارد کنید.
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
                            <CardTitle className="text-lg">خلاصه کارمزدها</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">مبلغ سرمایه‌گذاری:</span>
                              <span className="font-mono font-semibold">${watchAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">کارمزد ورود (۳٪):</span>
                              <span className="font-mono font-semibold text-red-500">-${entryFee.toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">کارمزد قرعه‌کشی (۲٪):</span>
                              <span className="font-mono font-semibold text-red-500">-${lotteryFee.toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">کارمزد پلتفرم (۱٪):</span>
                              <span className="font-mono font-semibold text-red-500">-${platformFee.toFixed(2)}</span>
                            </div>
                            <hr />
                             <div className="flex justify-between items-center text-base">
                              <span className="font-bold">سرمایه خالص شما:</span>
                              <span className="font-mono font-bold text-green-600">${netInvestment.toFixed(2)}</span>
                            </div>
                          </CardContent>
                       </Card>
                       <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
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
