
"use client";

import { useState } from "react";
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
import { Loader2, CheckCircle, Ban, ArrowUpRight, Copy } from "lucide-react";
import { updateWithdrawalStatusAction } from "@/app/actions/withdrawals";
import type { WithdrawalRequest } from "@/ai/flows/get-withdrawal-requests-flow";
import { Badge } from "../ui/badge";
import Link from "next/link";
import { Input } from "../ui/input";

interface WithdrawalDetailsDialogProps {
    request: WithdrawalRequest;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStatusChange: () => void;
}

export function WithdrawalDetailsDialog({ request, open, onOpenChange, onStatusChange }: WithdrawalDetailsDialogProps) {
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);
    const [showApprovalForm, setShowApprovalForm] = useState(false);
    const [adminTransactionProof, setAdminTransactionProof] = useState("");

    const handleStatusUpdate = async (newStatus: 'approved' | 'rejected') => {
        if (newStatus === 'approved' && !adminTransactionProof.trim()) {
            toast({ variant: "destructive", title: "خطا", description: "لطفاً رسید یا هش تراکنش را وارد کنید." });
            return;
        }

        setIsUpdating(true);
        try {
            const result = await updateWithdrawalStatusAction({ 
                withdrawalId: request.id, 
                newStatus, 
                adminTransactionProof: newStatus === 'approved' ? adminTransactionProof : undefined 
            });
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
            setShowApprovalForm(false);
            setAdminTransactionProof("");
        }
    };
    
    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "کپی شد!", description: "آدرس کیف پول در کلیپ‌بورد شما کپی شد."});
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>بررسی درخواست برداشت</DialogTitle>
                    <DialogDescription>
                        جزئیات درخواست برداشت را برای تایید یا رد بررسی کنید.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">کاربر:</span>
                        <Link href={`/admin/users/${request.userId}`} className="font-semibold text-primary hover:underline flex items-center gap-1">
                            {request.userFullName}
                            <ArrowUpRight className="h-4 w-4"/>
                        </Link>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">مبلغ درخواستی:</span>
                        <span className="font-mono">${request.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">مبلغ نهایی برای واریز:</span>
                        <span className="font-mono text-green-500 font-bold">${request.netAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">تاریخ درخواست:</span>
                        <span>{request.createdAt}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">وضعیت فعلی:</span>
                        <Badge variant={request.status === 'pending' ? 'outline' : 'destructive'}>{request.status}</Badge>
                    </div>
                    <div className="space-y-2">
                        <label className="text-muted-foreground">آدرس کیف پول مقصد:</label>
                        <div className="flex items-center gap-2">
                            <Input readOnly value={request.walletAddress} className="font-mono text-xs text-left" dir="ltr"/>
                            <Button type="button" variant="outline" size="icon" onClick={() => handleCopyToClipboard(request.walletAddress)}>
                                <Copy className="h-4 w-4"/>
                            </Button>
                        </div>
                    </div>
                    
                    {showApprovalForm && (
                        <div className="space-y-2 pt-4">
                            <label htmlFor="adminTransactionProof" className="font-medium">رسید یا هش تراکنش (TxID)</label>
                            <Input 
                                id="adminTransactionProof"
                                placeholder="هش تراکنش یا شماره رسید را وارد کنید"
                                value={adminTransactionProof}
                                onChange={(e) => setAdminTransactionProof(e.target.value)}
                                dir="ltr"
                            />
                        </div>
                    )}
                </div>
                
                <DialogFooter>
                    {request.status === 'pending' && !showApprovalForm && (
                        <>
                            <Button variant="destructive" onClick={() => handleStatusUpdate('rejected')} disabled={isUpdating}>
                                <Ban className="ml-2 h-4 w-4" />
                                رد کردن
                            </Button>
                             <Button onClick={() => setShowApprovalForm(true)} disabled={isUpdating}>
                                <CheckCircle className="ml-2 h-4 w-4" />
                                تایید و پرداخت
                            </Button>
                        </>
                    )}
                    {showApprovalForm && (
                        <>
                            <Button variant="secondary" onClick={() => setShowApprovalForm(false)} disabled={isUpdating}>لغو</Button>
                            <Button onClick={() => handleStatusUpdate('approved')} disabled={isUpdating || !adminTransactionProof.trim()}>
                                {isUpdating ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <CheckCircle className="ml-2 h-4 w-4" />}
                                ثبت نهایی پرداخت
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
