
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { MinusCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Asset, Transaction } from "@/ai/flows/get-user-wallet-flow";
import { getUserWalletAction } from "@/app/actions/wallet";
import { WithdrawalDialog } from "@/components/dashboard/withdrawal-dialog";

export default function WalletPage() {
    const { user } = useAuth();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [totalBalance, setTotalBalance] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchWalletData = useCallback(() => {
        if (user) {
            setLoading(true);
            getUserWalletAction({ userId: user.uid })
                .then(response => {
                    setAssets(response.assets);
                    setTransactions(response.recentTransactions);
                    setTotalBalance(response.totalBalance);
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

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">کیف پول</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-8">
        {/* Total Balance Card */}
        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle>موجودی کل</CardTitle>
            <CardDescription>مجموع ارزش دارایی‌های شما در کیف پول.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
                <div className="text-4xl font-bold font-mono">${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            )}
            <p className="text-xs text-muted-foreground mt-2">این مقدار بر اساس قیمت‌های لحظه‌ای است.</p>
          </CardContent>
          <CardFooter className="flex gap-2">
            <WithdrawalDialog 
                totalBalance={totalBalance}
                onWithdrawalSuccess={fetchWalletData}
            />
          </CardFooter>
        </Card>

        {/* Asset Breakdown Card */}
        <Card className="lg:col-span-3 xl:col-span-3">
            <CardHeader>
                <CardTitle>تفکیک دارایی‌ها</CardTitle>
                <CardDescription>موجودی شما در هر یک از صندوق‌های سرمایه‌گذاری.</CardDescription>
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
                       ) : assets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center py-10">
                                    شما در حال حاضر هیچ دارایی فعالی ندارید.
                                </TableCell>
                            </TableRow>
                       ) : (
                            assets.map((asset) => (
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
      </div>

       {/* Transaction History Card */}
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
                     ) : transactions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-10">
                                هیچ تراکنشی برای نمایش وجود ندارد.
                            </TableCell>
                        </TableRow>
                     ): (
                        transactions.map((tx) => (
                            <TableRow key={tx.id}>
                                <TableCell className="font-mono" title={tx.id}>{tx.id.substring(0,8)}...</TableCell>
                                <TableCell className="font-medium">{tx.type}</TableCell>
                                <TableCell>
                                    <Badge variant={tx.status === 'فعال' ? 'secondary' : tx.status === 'در انتظار' ? 'outline' : 'destructive'}>
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
