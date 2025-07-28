
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Wallet, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getUserWalletAction } from "@/app/actions/wallet";
import { WithdrawalDialog } from "@/components/dashboard/withdrawal-dialog";
import { GetUserWalletOutput } from "@/ai/flows/get-user-wallet-flow";

export default function WalletPage() {
    const { user } = useAuth();
    const [walletData, setWalletData] = useState<GetUserWalletOutput | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchWalletData = useCallback(() => {
        if (user) {
            setLoading(true);
            getUserWalletAction({ userId: user.uid })
                .then(response => {
                    setWalletData(response);
                })
                .catch(error => {
                    console.error("Failed to fetch wallet data:", error);
                    // Handle error state
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [user]);

    useEffect(() => {
        fetchWalletData();
    }, [user, fetchWalletData]);

    const walletBalance = walletData?.walletBalance ?? 0;
    const totalAssetValue = walletData?.totalAssetValue ?? 0;

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">کیف پول</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-8">
        <Card className="lg:col-span-2 xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">موجودی کیف پول</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                 <div className="text-4xl font-bold font-mono text-green-400">${walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            )}
            <p className="text-xs text-muted-foreground pt-2">این مبلغ شامل سودها، کمیسیون‌ها و جوایز شماست و قابل برداشت است.</p>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2 xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">مجموع دارایی‌های فعال</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                 <div className="text-4xl font-bold font-mono">${totalAssetValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            )}
            <p className="text-xs text-muted-foreground pt-2">ارزش خالص سرمایه‌گذاری‌های شما در صندوق‌ها.</p>
          </CardContent>
        </Card>
      </div>

       <Card>
            <CardHeader className="flex flex-row justify-between items-start">
                <div>
                    <CardTitle>دارایی‌ها و برداشت</CardTitle>
                    <CardDescription>موجودی خود را مدیریت کرده و درخواست برداشت ثبت کنید.</CardDescription>
                </div>
                <WithdrawalDialog 
                    walletBalance={walletBalance}
                    onWithdrawalSuccess={fetchWalletData}
                />
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>صندوق</TableHead>
                            <TableHead className="text-right">ارزش (دلار)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                       {loading ? (
                             <TableRow>
                                <TableCell colSpan={2} className="text-center py-10">
                                    <div className="flex justify-center items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin"/>
                                        <span>در حال بارگذاری دارایی‌ها...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                       ) : walletData?.assets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center py-10">
                                    شما در حال حاضر هیچ دارایی فعالی ندارید.
                                </TableCell>
                            </TableRow>
                       ) : (
                            walletData?.assets.map((asset) => (
                                <TableRow key={asset.fund}>
                                    <TableCell className="font-medium flex items-center">{asset.fund}</TableCell>
                                    <TableCell className="text-right font-mono">${asset.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                </TableRow>
                            ))
                       )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

      <Card>
        <CardHeader>
            <CardTitle>تاریخچه تراکنش‌های اخیر</CardTitle>
            <CardDescription>لیست ۵ تراکنش آخر شما.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>شناسه</TableHead>
                        <TableHead>نوع</TableHead>
                        <TableHead>وضعیت</TableHead>
                        <TableHead>تاریخ</TableHead>
                        <TableHead className="text-right">مبلغ (دلار)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                     {loading ? (
                         <TableRow>
                            <TableCell colSpan={5} className="text-center py-10">
                                <div className="flex justify-center items-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin"/>
                                    <span>در حال بارگذاری تاریخچه...</span>
                                </div>
                            </TableCell>
                        </TableRow>
                     ) : walletData?.recentTransactions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-10">
                                هیچ تراکنشی برای نمایش وجود ندارد.
                            </TableCell>
                        </TableRow>
                     ): (
                        walletData?.recentTransactions.map((tx) => (
                            <TableRow key={tx.id}>
                                <TableCell className="font-mono" title={tx.id}>{tx.id.substring(0,8)}...</TableCell>
                                <TableCell className="font-medium">{tx.type}</TableCell>
                                <TableCell>
                                    <Badge variant={tx.status === 'تکمیل شده' || tx.status === 'فعال' ? 'secondary' : tx.status === 'در انتظار' ? 'outline' : 'destructive'}>
                                        {tx.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{tx.date}</TableCell>
                                <TableCell className={`text-right font-mono ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                            </TableRow>
                        ))
                     )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </>
  );
}
