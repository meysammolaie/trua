
"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/date-range-picker";
import { FileDown, DollarSign, Users, Ticket, Loader2, PlayCircle, Unlock, PiggyBank, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TransactionWithUser, AllTransactionsStats } from "@/ai/flows/get-all-transactions-flow";
import { getAllTransactionsAction } from "@/app/actions/transactions";
import { useToast } from "@/hooks/use-toast";
import { distributeProfitsAction, unlockBonusesAction } from "@/app/actions/reports";

export default function AdminReportsPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [isDistributing, setIsDistributing] = useState(false);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [transactions, setTransactions] = useState<TransactionWithUser[]>([]);
    const [stats, setStats] = useState<AllTransactionsStats | null>(null);

     const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAllTransactionsAction();
            const financialEvents = data.transactions;
            setTransactions(financialEvents.slice(0, 10)); // Show latest 10
            setStats(data.stats);
        } catch (error) {
            console.error("Failed to fetch transaction data:", error);
            toast({
                variant: "destructive",
                title: "Fetch Error",
                description: "There was a problem retrieving financial reports."
            })
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDistributeProfits = async () => {
        setIsDistributing(true);
        toast({ title: "Operation in Progress", description: "Profit distribution has started..."});
        try {
            const result = await distributeProfitsAction();
            if (result.success) {
                toast({
                    title: "Operation Successful",
                    description: result.message,
                });
                await fetchData(); // Refresh data after distribution
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Profit Distribution Error",
                description: error instanceof Error ? error.message : "An unknown error occurred."
            });
        } finally {
            setIsDistributing(false);
        }
    }
    
    const handleUnlockBonuses = async () => {
        setIsUnlocking(true);
        toast({ title: "Operation in Progress", description: "Unlocking bonuses has started..."});
        try {
            const result = await unlockBonusesAction();
            if (result.success) {
                toast({
                    title: "Operation Successful",
                    description: result.message,
                });
                await fetchData(); // Refresh data after unlocking
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Bonus Unlocking Error",
                description: error instanceof Error ? error.message : "An unknown error occurred."
            });
        } finally {
            setIsUnlocking(false);
        }
    }

    const typeNames: Record<string, string> = {
        investment: "Investment",
        profit_payout: "Profit Payout",
        commission: "Commission",
        principal_return: "Principal Return",
        withdrawal_request: "Withdrawal Request",
        withdrawal_refund: "Withdrawal Refund",
        bonus: "Bonus"
    };
    
    const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Financial Reports & Operations</h1>
        <div className="flex items-center gap-2">
            <DateRangePicker />
            <Button variant="outline">
                <FileDown className="h-4 w-4 mr-2" />
                Export
            </Button>
        </div>
      </div>

       <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Platform TVL</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin"/> :
                <div className="text-2xl font-bold font-mono">{formatCurrency(stats?.totalPlatformWallet ?? 0)}</div>
            }
            <p className="text-xs text-muted-foreground">
              Total net active capital of users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Pool (To Distribute)</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin"/> :
                <div className="text-2xl font-bold font-mono">{formatCurrency(stats?.totalProfitPool ?? 0)}</div>
            }
            <p className="text-xs text-muted-foreground">
              Sum of entry and exit fees
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Platform Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin"/> :
                <div className="text-2xl font-bold font-mono">{formatCurrency(stats?.totalPlatformRevenue ?? 0)}</div>
            }
            <p className="text-xs text-muted-foreground">
              From the 1% platform fee only
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lottery Pool</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin"/> :
                <div className="text-2xl font-bold font-mono">{formatCurrency(stats?.totalLotteryPool ?? 0)}</div>
            }
            <p className="text-xs text-muted-foreground">
              Ready for monthly draws
            </p>
          </CardContent>
        </Card>
      </div>
      
       <div className="grid gap-4 md:grid-cols-2 lg:gap-8">
        <Card>
            <CardHeader>
                <CardTitle>Daily Profit Distribution</CardTitle>
                <CardDescription>
                    By running this operation, accumulated profit from fees (entry/exit) will be distributed among active investors of each fund.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Button className="w-full" onClick={handleDistributeProfits} disabled={isDistributing || loading}>
                    {isDistributing ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Distributing...
                        </>
                    ) : (
                        <>
                             <PlayCircle className="h-4 w-4 mr-2" />
                            Run Profit Distribution
                        </>
                    )}
                 </Button>
            </CardContent>
             <CardFooter>
                <p className="text-xs text-muted-foreground">
                    This operation distributes new fees to active users.
                </p>
             </CardFooter>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>Unlock Bonuses</CardTitle>
                <CardDescription>
                   This operation will unlock all locked user bonuses and add them to their wallets.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Button variant="secondary" className="w-full" onClick={handleUnlockBonuses} disabled={isUnlocking || loading}>
                    {isUnlocking ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Unlocking...
                        </>
                    ) : (
                        <>
                             <Unlock className="h-4 w-4 mr-2" />
                            Run Bonus Unlock
                        </>
                    )}
                 </Button>
            </CardContent>
             <CardFooter>
                <p className="text-xs text-muted-foreground">
                    Only press this button when the condition for unlocking bonuses has been met.
                </p>
             </CardFooter>
        </Card>
      </div>

       <Card>
            <CardHeader>
                <CardTitle>Fund Stats for Profit Distribution</CardTitle>
                <CardDescription>
                   This table shows the status of each fund before running the profit distribution operation.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fund</TableHead>
                            <TableHead className="text-right">Daily Profit Pool</TableHead>
                            <TableHead className="text-right">Active Investment</TableHead>
                             <TableHead className="text-center">Investor Count</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                             <TableRow>
                                <TableCell colSpan={4} className="text-center py-10">
                                    <div className="flex justify-center items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin"/>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : stats?.fundStats.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10">
                                   No data to display.
                                </TableCell>
                            </TableRow>
                        ) : (
                            stats?.fundStats.map((fund) => (
                                <TableRow key={fund.id}>
                                    <TableCell className="font-medium">{fund.name}</TableCell>
                                    <TableCell className="text-right font-mono text-green-500">{formatCurrency(fund.profitPool)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(fund.totalActiveInvestment)}</TableCell>
                                    <TableCell className="text-center font-mono">{fund.investorCount.toLocaleString()}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
       </Card>

       <Card>
            <CardHeader>
                <CardTitle>Recent Financial Events</CardTitle>
                <CardDescription>
                    A list of the latest financial events recorded in the system.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Event Type</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                             <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                    <div className="flex justify-center items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin"/>
                                        <span>Loading events...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                   No financial events to display.
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions.map((event) => (
                                <TableRow key={event.id}>
                                    <TableCell className="font-mono">{event.id.substring(0, 8)}...</TableCell>
                                    <TableCell>
                                        <Badge variant={event.amount > 0 ? "secondary" : "destructive"}>
                                            {typeNames[event.type] || event.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{event.userFullName}</TableCell>
                                    <TableCell>{event.createdAt}</TableCell>
                                    <TableCell className={`text-right font-mono ${event.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {event.amount > 0 ? '+' : ''}{formatCurrency(event.amount)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
             <CardFooter>
                <div className="text-xs text-muted-foreground">
                    Showing <strong>{transactions.length}</strong> of the latest financial events
                </div>
            </CardFooter>
       </Card>
    </>
  );
}
