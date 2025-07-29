
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, MinusCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { createWithdrawalRequestAction } from "@/app/actions/withdrawals";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getPlatformSettingsAction } from "@/app/actions/platform-settings";
import type { PlatformSettings } from "@/ai/flows/platform-settings-flow";
import { cn } from "@/lib/utils";

const withdrawalSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  walletAddress: z.string().min(10, { message: "Please enter a valid USDT wallet address." }),
  twoFactorCode: z.string().length(6, { message: "The verification code must be 6 digits." }),
});

interface WithdrawalDialogProps {
  withdrawableBalance: number;
  onWithdrawalSuccess: () => void;
}

export function WithdrawalDialog({ withdrawableBalance, onWithdrawalSuccess }: WithdrawalDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  
  const form = useForm<z.infer<typeof withdrawalSchema>>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 10,
      walletAddress: "",
      twoFactorCode: "",
    },
  });

  const { isSubmitting } = form.formState;

  useEffect(() => {
    if (open) {
        getPlatformSettingsAction().then(setSettings).catch(console.error);
    }
  }, [open]);

  async function onSubmit(values: z.infer<typeof withdrawalSchema>) {
    if (!user) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in to submit a request." });
        return;
    }
     if (values.amount > withdrawableBalance) {
        form.setError("amount", { message: "The requested amount exceeds your balance." });
        return;
    }
    if (settings && values.amount < settings.minWithdrawalAmount) {
         form.setError("amount", { message: `Minimum withdrawal amount is $${settings.minWithdrawalAmount}.` });
        return;
    }


    try {
        const result = await createWithdrawalRequestAction({
            userId: user.uid,
            amount: values.amount,
            walletAddress: values.walletAddress,
            twoFactorCode: values.twoFactorCode,
        });

        if (result.success) {
            toast({ title: "Request Successful", description: result.message });
            setOpen(false);
            form.reset();
            onWithdrawalSuccess();
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error Submitting Request",
            description: error instanceof Error ? error.message : "An unknown error occurred.",
        })
    }
  }

  const watchedAmount = form.watch("amount", 0);
  const numericAmount = parseFloat(String(watchedAmount)) || 0;
  
  const exitFee = settings ? numericAmount * (settings.exitFee / 100) : 0;
  const networkFee = settings ? settings.networkFee : 0;
  const totalFees = exitFee + networkFee;
  const netAmount = numericAmount - totalFees;
  const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full md:w-auto" disabled={withdrawableBalance <= 0}>
            <MinusCircle className="mr-2 h-4 w-4" />
            Create Withdrawal Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdrawal Request</DialogTitle>
          <DialogDescription>
            Enter the amount and your USDT wallet address to receive the funds.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Withdrawal Amount ($)</FormLabel>
                        <FormControl>
                            <Input type="number" step="any" {...field} />
                        </FormControl>
                        <FormDescription>
                            Withdrawable Balance: {formatCurrency(withdrawableBalance)}
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="walletAddress"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>USDT Wallet Address (BEP-20 Network)</FormLabel>
                        <FormControl>
                            <Input dir="ltr" placeholder="0x..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="twoFactorCode"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Two-Factor Code (2FA)</FormLabel>
                         <FormControl>
                            <div className="relative">
                               <ShieldCheck className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                               <Input dir="ltr" placeholder="123456" {...field} className="tracking-[0.5em] text-center" maxLength={6}/>
                            </div>
                         </FormControl>
                         <FormDescription>
                           Enter the code from your 2FA authenticator app. (Test code: 123456)
                         </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />


                {numericAmount > 0 && settings && (
                    <div className="space-y-2 rounded-lg border p-4">
                        <h4 className="font-medium text-sm">Withdrawal Summary</h4>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Requested Amount:</span>
                            <span className="font-mono font-semibold">{formatCurrency(numericAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Exit Fee ({settings.exitFee}%):</span>
                            <span className={cn("font-mono font-semibold text-red-500")}>-{formatCurrency(exitFee)}</span>
                        </div>
                         <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Network Fee:</span>
                            <span className={cn("font-mono font-semibold text-red-500")}>-{formatCurrency(networkFee)}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between items-center font-bold text-base">
                            <span>You will receive:</span>
                            <span className={cn("font-mono", netAmount > 0 ? "text-green-500" : "text-red-500")}>
                                {netAmount > 0 ? formatCurrency(netAmount) : formatCurrency(0)}
                            </span>
                        </div>
                    </div>
                )}


                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Important Warning</AlertTitle>
                  <AlertDescription>
                    Please enter your USDT wallet address (BEP-20 network) carefully. You are responsible for any incorrect addresses, which may lead to the loss of your assets.
                  </AlertDescription>
                </Alert>

                <DialogFooter>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? "Submitting..." : "Submit Withdrawal Request"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
