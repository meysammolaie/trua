
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
import { DollarSign, Wallet, Loader2, PiggyBank, Lock, TrendingUp } from "lucide-react";
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
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [user]);

    useEffect(() => {
        fetchWalletData();
    }, [fetchWalletData]);

    const walletBalance = walletData?.walletBalance ?? 0;
    const activeInvestment = walletData?.totalAssetValue ?? 0; // This is the active investment amount
    const lockedBonus = walletData?.lockedBonus ?? 0;
    const totalValue = walletBalance + lockedBonus; // Correct calculation
    const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Wallet</h1>
      </div>
      <div className="grid gap-4 md:gap-8">
        <Card className="lg:col-span-2 xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Asset Value</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                 <div className="text-4xl font-bold font-mono text-green-400">{formatCurrency(totalValue)}</div>
            )}
            <p className="text-xs text-muted-foreground pt-2">The total of your withdrawable balance and locked bonus.</p>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Wallet Balance (Withdrawable)</CardTitle>
                    <PiggyBank className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                        <div className="text-2xl font-bold font-mono">{formatCurrency(walletBalance)}</div>
                    )}
                    <p className="text-xs text-muted-foreground pt-1">This balance includes your principal, profits, and commissions.</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Active Investment</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                        <div className="text-2xl font-bold font-mono">{formatCurrency(activeInvestment)}</div>
                    )}
                    <p className="text-xs text-muted-foreground pt-1">This amount is the basis for your daily profit calculation.</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Locked Bonus</CardTitle>
                    <Lock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                        <div className="text-2xl font-bold font-mono">{formatCurrency(lockedBonus)}</div>
                    )}
                    <p className="text-xs text-muted-foreground pt-1">This amount will be unlocked for you in the future.</p>
                </CardContent>
            </Card>
        </div>
      </div>

       <Card>
            <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <CardTitle>Withdraw from Wallet</CardTitle>
                    <CardDescription>Manage your wallet balance and create withdrawal requests.</CardDescription>
                </div>
                <WithdrawalDialog 
                    withdrawableBalance={walletBalance}
                    onWithdrawalSuccess={fetchWalletData}
                />
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    Your withdrawable balance includes your active investment principal, daily profits, commissions, and unlocked bonuses. You can withdraw this amount at any time.
                </p>
            </CardContent>
        </Card>

      <Card>
        <CardHeader>
            <CardTitle>Recent Transaction History</CardTitle>
            <CardDescription>A list of your last 5 transactions.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount ($)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                     {loading ? (
                         <TableRow>
                            <TableCell colSpan={5} className="text-center py-10">
                                <div className="flex justify-center items-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin"/>
                                    <span>Loading history...</span>
                                </div>
                            </TableCell>
                        </TableRow>
                     ) : walletData?.recentTransactions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-10">
                                No transactions to display.
                            </TableCell>
                        </TableRow>
                     ): (
                        walletData?.recentTransactions.map((tx) => (
                            <TableRow key={tx.id}>
                                <TableCell className="font-mono" title={tx.id}>{tx.id.substring(0,8)}...</TableCell>
                                <TableCell className="font-medium">{tx.type}</TableCell>
                                <TableCell>
                                    <Badge variant={tx.status === 'Completed' || tx.status === 'Active' ? 'secondary' : tx.status === 'Pending' ? 'outline' : 'destructive'}>
                                        {tx.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{tx.date}</TableCell>
                                <TableCell className={`text-right font-mono ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {tx.amount > 0 ? '+' : ''}{Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
