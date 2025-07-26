
"use client";

import { useState } from "react";
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
import { Loader2, MinusCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { createWithdrawalRequest } from "@/ai/flows/create-withdrawal-request-flow";

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
  
  const form = useForm<z.infer<typeof withdrawalSchema>>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 10,
      walletAddress: "",
    },
  });

  const { isSubmitting } = form.formState;

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
        const result = await createWithdrawalRequest({
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" disabled={totalBalance <= 0}>
            <MinusCircle className="ml-2 h-4 w-4" />
            برداشت
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
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
