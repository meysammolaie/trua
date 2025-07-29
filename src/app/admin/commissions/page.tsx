
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
import { Input } from "@/components/ui/input";
import { Search, FileDown, Loader2, DollarSign, Users, Gift } from "lucide-react";
import { Commission } from "@/ai/flows/get-commissions-flow";
import { getCommissionsAction } from "@/app/actions/commissions";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { DateRangePicker } from "@/components/date-range-picker";
import { DateRange } from "react-day-picker";

type Stats = {
    totalCommissionsPaid: number;
    totalReferredInvestments: number;
    commissionCount: number;
}

export default function AdminCommissionsPage() {
    const { toast } = useToast();
    const [allCommissions, setAllCommissions] = useState<Commission[]>([]);
    const [filteredCommissions, setFilteredCommissions] = useState<Commission[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState<DateRange | undefined>();


    const fetchCommissions = useCallback(() => {
        setLoading(true);
        getCommissionsAction()
            .then(data => {
                setAllCommissions(data.commissions);
                setFilteredCommissions(data.commissions);
                setStats(data.stats);
            })
            .catch(error => {
                console.error("Error fetching commissions:", error);
                toast({
                    variant: "destructive",
                    title: "Error Fetching Data",
                    description: "There was a problem retrieving the commission list.",
                });
            })
            .finally(() => setLoading(false));
    }, [toast]);

    useEffect(() => {
        fetchCommissions();
    }, [fetchCommissions]);

    useEffect(() => {
        let result = allCommissions;
        
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            result = result.filter(req => 
                req.referrerFullName.toLowerCase().includes(lowercasedTerm) || 
                req.referredUserFullName.toLowerCase().includes(lowercasedTerm) ||
                req.investmentId.toLowerCase().includes(lowercasedTerm)
            );
        }

        if (dateRange?.from && dateRange?.to) {
            result = result.filter(req => {
                const reqDate = req.createdAtTimestamp;
                // Set to to the end of the day
                const toDate = new Date(dateRange.to!);
                toDate.setHours(23, 59, 59, 999);
                return reqDate >= dateRange.from!.getTime() && reqDate <= toDate.getTime();
            });
        }

        setFilteredCommissions(result);
    }, [searchTerm, dateRange, allCommissions]);

    const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Commission Management</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Commissions Paid</CardTitle>
                        <Gift className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold font-mono">{formatCurrency(stats?.totalCommissionsPaid ?? 0)}</div>}
                        <p className="text-xs text-muted-foreground">To all referrers</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Referred Investment</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold font-mono">{formatCurrency(stats?.totalReferredInvestments ?? 0)}</div>}
                        <p className="text-xs text-muted-foreground">Investment from referred users</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{stats?.commissionCount.toLocaleString() ?? 0}</div>}
                        <p className="text-xs text-muted-foreground">Number of commission transactions</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex-1">
                            <CardTitle>Commissions List</CardTitle>
                            <CardDescription>View commissions paid to referring users.</CardDescription>
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
                            <div className="relative w-full md:w-auto">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search referrer or referred user..."
                                    className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline"><FileDown className="h-4 w-4 mr-2" />Export</Button>
                        </div>
                    </div>
                     <div className="flex flex-col md:flex-row items-center gap-2 mt-4">
                        <DateRangePicker onDateChange={setDateRange} />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Referrer</TableHead>
                                <TableHead>Referred User</TableHead>
                                <TableHead className="text-right">Investment Amount</TableHead>
                                <TableHead className="text-right">Commission Amount</TableHead>
                                <TableHead className="text-center">Date</TableHead>
                                <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="h-5 w-5 animate-spin mx-auto"/></TableCell></TableRow>
                            ) : filteredCommissions.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-10">No commissions found.</TableCell></TableRow>
                            ) : (
                                filteredCommissions.map((commission) => (
                                    <TableRow key={commission.id}>
                                        <TableCell className="font-medium">{commission.referrerFullName}</TableCell>
                                        <TableCell>{commission.referredUserFullName}</TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(commission.investmentAmount)}</TableCell>
                                        <TableCell className="text-right font-mono text-green-500">{formatCurrency(commission.commissionAmount)}</TableCell>
                                        <TableCell className="text-center">{commission.createdAt}</TableCell>
                                        <TableCell>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/admin/investments?search=${commission.investmentId}`}>
                                                    View Investment
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter>
                    <div className="text-xs text-muted-foreground">Showing <strong>{filteredCommissions.length}</strong> of <strong>{allCommissions.length}</strong> commissions</div>
                </CardFooter>
            </Card>
        </>
    );
}
