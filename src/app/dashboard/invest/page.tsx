
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
import { Bitcoin, Crown, DollarSign, Medal, Copy, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { submitInvestmentAction } from "@/app/actions/investment";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { FundDetails } from "@/ai/flows/get-fund-details-flow";
import { getFundDetailsAction } from "@/app/actions/funds";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const investmentSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  transactionHash: z.string().min(10, { message: "Please enter a valid transaction hash." }),
});

type FundId = "usdt" | "bitcoin" | "gold" | "silver";

const fundIcons: Record<FundId, React.ReactNode> = {
    usdt: <DollarSign className="w-5 h-5 mr-2" />,
    bitcoin: <Bitcoin className="w-5 h-5 mr-2" />,
    gold: <Crown className="w-5 h-5 mr-2" />,
    silver: <Medal className="w-5 h-5 mr-2" />,
};

const fundMinimums: Partial<Record<FundId, number>> = {
    bitcoin: 0.00001, // Example minimum for BTC
};

const formatCryptoValue = (value: number): string => {
    if (value === 0) return "0.0000";
    // If the number is very small, use exponential notation to avoid long strings of zeros.
    if (value > 0 && value < 0.0001) {
        return value.toExponential(2);
    }
    // Otherwise, show a reasonable number of decimal places.
    return value.toFixed(8);
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
        const details = await getFundDetailsAction();
        setFundDetails(details);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "There was an error loading fund information.",
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
      amount: 0,
      transactionHash: "",
    },
  });
  
  const watchedAmount = form.watch("amount", 0);
  const numericAmount = parseFloat(String(watchedAmount)) || 0;
  
  const entryFee = numericAmount * (fundDetails?.settings?.entryFee || 0) / 100;
  const lotteryFee = numericAmount * (fundDetails?.settings?.lotteryFee || 0) / 100;
  const platformFee = numericAmount * (fundDetails?.settings?.platformFee || 0) / 100;
  const totalFee = entryFee + lotteryFee + platformFee;
  const netInvestment = numericAmount - totalFee;
  const netInvestmentUSD = netInvestment * (activeFund?.price.usd || 0);

  async function onSubmit(values: z.infer<typeof investmentSchema>) {
    if (!user || !activeFund) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to make an investment.",
      });
      return;
    }

    const amountInUSD = values.amount * (activeFund.price.usd || 0);
    if (amountInUSD < 1) {
        form.setError("amount", { message: `Minimum investment is equivalent to $1.` });
        return;
    }

    const fundMinimum = fundMinimums[activeFund.id as FundId];
    if (fundMinimum && values.amount < fundMinimum) {
        form.setError("amount", { message: `The minimum amount for this fund is ${fundMinimum} ${activeFund.unit}.` });
        return;
    }

    try {
      const result = await submitInvestmentAction({
        userId: user.uid,
        fundId: activeFund.id,
        amount: values.amount,
        transactionHash: values.transactionHash,
      });

      if (result.success) {
        toast({
          title: "Request Submitted",
          description: result.message,
        });
        form.reset({ amount: 0, transactionHash: "" });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Investment Error",
        description: error instanceof Error ? error.message : "An error occurred.",
      });
    }
  }

  const handleCopyToClipboard = () => {
    if (!activeFund?.walletAddress) return;
    navigator.clipboard.writeText(activeFund.walletAddress);
    toast({
      title: "Copied!",
      description: "The wallet address has been copied to your clipboard.",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="ml-4">Loading investment form...</p>
      </div>
    );
  }
  
  if (!fundDetails) {
    return <div className="text-center">Fund information not found.</div>
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Invest</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Create New Investment</CardTitle>
          <CardDescription>
            Select your desired fund and start the investment process.
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
                          <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Very Important Notice</AlertTitle>
                            <AlertDescription>
                              Please deposit funds <span className="font-bold">only via the BEP-20 network</span> to the address below. Sending via other networks will result in the permanent loss of your funds.
                            </AlertDescription>
                          </Alert>
                         <FormField
                           control={form.control}
                           name="amount"
                           render={({ field }) => (
                             <FormItem>
                               <FormLabel>Investment Amount ({activeFund.unit})</FormLabel>
                               <FormControl>
                                 <Input type="number" step="any" {...field} placeholder="0.00" />
                               </FormControl>
                               <FormDescription>
                                 Minimum investment amount is equivalent to $1 USD.
                               </FormDescription>
                               <FormMessage />
                             </FormItem>
                           )}
                         />
   
                         <div>
                           <Label>Platform Wallet Address ({activeFund.unit})</Label>
                           <div className="flex items-center gap-2 mt-2">
                             <Input readOnly value={activeFund.walletAddress} className="text-left" dir="ltr" />
                             <Button type="button" variant="outline" size="icon" onClick={handleCopyToClipboard} disabled={!activeFund.walletAddress}>
                               <Copy className="h-4 w-4" />
                             </Button>
                           </div>
                           
                         </div>
   
                          <FormField
                           control={form.control}
                           name="transactionHash"
                           render={({ field }) => (
                             <FormItem>
                               <FormLabel>Transaction Hash (TxID)</FormLabel>
                               <FormControl>
                                 <Input placeholder="0x..." {...field} className="text-left" dir="ltr" />
                               </FormControl>
                                <FormDescription>
                                 Enter the transaction hash here after making the deposit.
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
                               <CardTitle className="text-lg">Financial Summary</CardTitle>
                             </CardHeader>
                             <CardContent className="space-y-4 text-sm">
                               <div className="flex justify-between items-center">
                                 <span className="text-muted-foreground">Investment Amount:</span>
                                 <span className="font-mono font-semibold">{formatCryptoValue(numericAmount)} {activeFund.unit}</span>
                               </div>
                               <div className="flex justify-between items-center">
                                 <span className="text-muted-foreground">Entry Fee ({fundDetails.settings?.entryFee}%):</span>
                                 <span className={cn("font-mono font-semibold", numericAmount > 0 && "text-red-500")}>-{formatCryptoValue(entryFee)} {activeFund.unit}</span>
                               </div>
                                <div className="flex justify-between items-center">
                                 <span className="text-muted-foreground">Lottery Fee ({fundDetails.settings?.lotteryFee}%):</span>
                                 <span className={cn("font-mono font-semibold", numericAmount > 0 && "text-red-500")}>-{formatCryptoValue(lotteryFee)} {activeFund.unit}</span>
                               </div>
                                <div className="flex justify-between items-center">
                                 <span className="text-muted-foreground">Platform Fee ({fundDetails.settings?.platformFee}%):</span>
                                 <span className={cn("font-mono font-semibold", numericAmount > 0 && "text-red-500")}>-{formatCryptoValue(platformFee)} {activeFund.unit}</span>
                               </div>
                               <hr />
                                <div className="flex justify-between items-center text-base">
                                 <span className="font-bold">Your Net Investment:</span>
                                 <div className="flex flex-col items-end">
                                    <span className={cn("font-mono font-bold", netInvestment >= 0 ? "text-green-500" : "text-red-500")}>
                                        {formatCryptoValue(netInvestment)} {activeFund.unit}
                                    </span>
                                     <span className="text-xs text-muted-foreground font-mono">
                                        ~${netInvestmentUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                 </div>
                               </div>
                             </CardContent>
                          </Card>
                          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || !activeFund.walletAddress}>
                            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {form.formState.isSubmitting ? "Submitting..." : "Submit Investment"}
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
