
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
import { Loader2, MinusCircle, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { createWithdrawalRequestAction } from "@/app/actions/withdrawals";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getPlatformSettingsAction } from "@/app/actions/platform-settings";
import type { PlatformSettings } from "@/ai/flows/platform-settings-flow";
import { cn } from "@/lib/utils";

const withdrawalSchema = z.object({
  amount: z.coerce.number().positive({ message: "مبلغ باید مثبت باشد." }),
  walletAddress: z.string().min(10, { message: "لطفاً یک آدرس کیف پول معتبر (USDT) وارد کنید." }),
});

interface WithdrawalDialogProps {
  totalBalance: number;
  onWithdrawalSuccess: () => void;
}

export function WithdrawalDialog({ totalBalance, onWithdrawalSuccess }: WithdrawalDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  
  const form = useForm<z.infer<typeof withdrawalSchema>>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 10,
      walletAddress: "",
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
        toast({ variant: "destructive", title: "خطا", description: "برای ثبت درخواست باید وارد شوید." });
        return;
    }
     if (values.amount > totalBalance) {
        form.setError("amount", { message: "مبلغ درخواستی از موجودی شما بیشتر است." });
        return;
    }

    try {
        const result = await createWithdrawalRequestAction({
            userId: user.uid,
            amount: values.amount,
            walletAddress: values.walletAddress,
        });

        if (result.success) {
            toast({ title: "درخواست موفق", description: result.message });
            setOpen(false);
            form.reset();
            onWithdrawalSuccess();
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        toast({
            variant: "destructive",
            title: "خطا در ثبت درخواست",
            description: error instanceof Error ? error.message : "یک خطای ناشناخته رخ داد.",
        })
    }
  }

  const watchedAmount = form.watch("amount", 0);
  const numericAmount = parseFloat(String(watchedAmount)) || 0;
  
  const exitFee = settings ? numericAmount * (settings.exitFee / 100) : 0;
  const networkFee = settings ? settings.networkFee : 0;
  const totalFees = exitFee + networkFee;
  const netAmount = numericAmount - totalFees;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" disabled={totalBalance <= 0}>
            <MinusCircle className="ml-2 h-4 w-4" />
            برداشت
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>درخواست برداشت وجه</DialogTitle>
          <DialogDescription>
            مبلغ مورد نظر و آدرس کیف پول USDT خود را برای دریافت وجه وارد کنید.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>مبلغ برداشت (دلار)</FormLabel>
                        <FormControl>
                            <Input type="number" step="any" {...field} />
                        </FormControl>
                        <FormDescription>
                            موجودی قابل برداشت: ${totalBalance.toLocaleString()}
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
                        <FormLabel>آدرس کیف پول USDT (شبکه TRC20)</FormLabel>
                        <FormControl>
                            <Input dir="ltr" placeholder="T..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                {numericAmount > 0 && settings && (
                    <div className="space-y-2 rounded-lg border p-4">
                        <h4 className="font-medium text-sm">خلاصه برداشت</h4>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">مبلغ درخواستی:</span>
                            <span className="font-mono font-semibold">${numericAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">کارمزد خروج ({settings.exitFee}%):</span>
                            <span className={cn("font-mono font-semibold text-red-500")}>-${exitFee.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                        </div>
                         <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">کارمزد شبکه:</span>
                            <span className={cn("font-mono font-semibold text-red-500")}>-${networkFee.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between items-center font-bold text-base">
                            <span>مبلغ دریافتی شما:</span>
                            <span className={cn("font-mono", netAmount > 0 ? "text-green-500" : "text-red-500")}>
                                ${netAmount > 0 ? netAmount.toLocaleString('en-US', {minimumFractionDigits: 2}) : '0.00'}
                            </span>
                        </div>
                    </div>
                )}


                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>هشدار مهم</AlertTitle>
                  <AlertDescription>
                    لطفاً آدرس کیف پول USDT (شبکه TRC20) را با دقت وارد کنید. مسئولیت آدرس اشتباه بر عهده شماست و ممکن است منجر به از دست رفتن دارایی شما شود.
                  </AlertDescription>
                </Alert>

                <DialogFooter>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? "در حال ارسال..." : "ثبت درخواست برداشت"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
