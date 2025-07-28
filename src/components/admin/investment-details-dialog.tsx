
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, Ban, ArrowUpRight, Copy, AlertTriangle, PackageCheck } from "lucide-react";
import { getInvestmentDetailsAction } from "@/app/actions/investment";
import { updateInvestmentStatusAction } from "@/app/actions/investment-status";
import type { GetInvestmentDetailsOutput } from "@/ai/flows/get-investment-details-flow";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import Link from "next/link";
import { Input } from "../ui/input";

interface InvestmentDetailsDialogProps {
    investmentId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStatusChange: () => void;
}

export function InvestmentDetailsDialog({ investmentId, open, onOpenChange, onStatusChange }: InvestmentDetailsDialogProps) {
    const { toast } = useToast();
    const [details, setDetails] = useState<GetInvestmentDetailsOutput | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showRejectionForm, setShowRejectionForm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");


    useEffect(() => {
        if (open && investmentId) {
            setLoading(true);
            setShowRejectionForm(false);
            setRejectionReason("");
            getInvestmentDetailsAction({ investmentId })
                .then(setDetails)
                .catch(err => {
                    toast({ variant: "destructive", title: "خطا", description: `مشکلی در واکشی جزئیات سرمایه‌گذاری رخ داد: ${err.message}` });
                    onOpenChange(false);
                })
                .finally(() => setLoading(false));
        }
    }, [open, investmentId, toast, onOpenChange]);

    const handleStatusUpdate = async (newStatus: 'active' | 'rejected' | 'completed') => {
        if (newStatus === 'rejected' && !rejectionReason.trim()) {
            toast({ variant: "destructive", title: "خطا", description: "لطفاً علت رد درخواست را وارد کنید." });
            return;
        }

        setIsUpdating(true);
        try {
            const result = await updateInvestmentStatusAction({ investmentId, newStatus, rejectionReason });
            if (result.success) {
                toast({ title: "عملیات موفق", description: result.message });
                onStatusChange();
                onOpenChange(false);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "خطا در بروزرسانی وضعیت",
                description: error instanceof Error ? error.message : "مشکلی پیش آمد."
            });
        } finally {
            setIsUpdating(false);
        }
    };
    
    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
        title: "کپی شد!",
        description: "هش تراکنش در کلیپ‌بورد شما کپی شد.",
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>بررسی و مدیریت سرمایه‌گذاری</DialogTitle>
                    <DialogDescription>
                        جزئیات سرمایه‌گذاری را برای تایید یا رد بررسی کنید.
                    </DialogDescription>
                </DialogHeader>
                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : details ? (
                    <div className="space-y-4 py-4 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">کاربر:</span>
                            <Link href={`/admin/users/${details.userId}`} className="font-semibold text-primary hover:underline flex items-center gap-1">
                                {details.userFullName}
                                <ArrowUpRight className="h-4 w-4"/>
                            </Link>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">ایمیل کاربر:</span>
                            <span className="font-mono">{details.userEmail}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">صندوق:</span>
                            <span className="font-semibold">{details.fundName}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">مبلغ ارزی:</span>
                            <span className="font-mono">{details.amount.toLocaleString()} {details.fundId.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">مبلغ دلاری (در زمان ثبت):</span>
                            <span className="font-mono">${details.amountUSD.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">تاریخ ثبت:</span>
                            <span>{details.createdAt}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">وضعیت فعلی:</span>
                            <Badge variant={details.status === 'active' ? 'secondary' : details.status === 'pending' ? 'outline' : 'destructive'}>{details.status}</Badge>
                        </div>

                         <div className="space-y-2">
                            <label className="text-muted-foreground">هش تراکنش (TxID):</label>
                            <div className="flex items-center gap-2">
                                <Input readOnly value={details.transactionHash} className="font-mono text-xs text-left" dir="ltr"/>
                                <Button type="button" variant="outline" size="icon" onClick={() => handleCopyToClipboard(details.transactionHash)}>
                                    <Copy className="h-4 w-4"/>
                                </Button>
                            </div>
                        </div>

                        {details.status === 'rejected' && details.rejectionReason && (
                             <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>علت رد شدن درخواست</AlertTitle>
                                <AlertDescription>{details.rejectionReason}</AlertDescription>
                            </Alert>
                        )}
                        
                        {showRejectionForm && (
                            <div className="space-y-2 pt-4">
                                <label htmlFor="rejectionReason" className="font-medium">علت رد درخواست</label>
                                <Textarea 
                                    id="rejectionReason"
                                    placeholder="توضیح دهید چرا این سرمایه‌گذاری رد می‌شود (مثلاً هش تراکنش نامعتبر است)..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                />
                            </div>
                        )}

                    </div>
                ) : (
                    <div className="text-center py-10">اطلاعاتی یافت نشد.</div>
                )}
                
                <DialogFooter className="gap-2">
                    {details?.status === 'pending' && !showRejectionForm && (
                        <>
                            <Button variant="destructive" onClick={() => setShowRejectionForm(true)} disabled={isUpdating}>
                                <Ban className="ml-2 h-4 w-4" />
                                رد کردن
                            </Button>
                             <Button onClick={() => handleStatusUpdate('active')} disabled={isUpdating}>
                                {isUpdating ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <CheckCircle className="ml-2 h-4 w-4" />}
                                تایید نهایی
                            </Button>
                        </>
                    )}
                     {showRejectionForm && (
                        <>
                            <Button variant="secondary" onClick={() => setShowRejectionForm(false)} disabled={isUpdating}>لغو</Button>
                            <Button variant="destructive" onClick={() => handleStatusUpdate('rejected')} disabled={isUpdating || !rejectionReason.trim()}>
                                {isUpdating ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Ban className="ml-2 h-4 w-4" />}
                                ثبت رد درخواست
                            </Button>
                        </>
                    )}
                    {details?.status === 'active' && (
                        <Button variant="outline" onClick={() => handleStatusUpdate('completed')} disabled={isUpdating}>
                            {isUpdating ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <PackageCheck className="ml-2 h-4 w-4" />}
                            تکمیل سرمایه‌گذاری
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
