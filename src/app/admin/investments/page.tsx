
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from 'next/navigation'
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, FileDown, CheckCircle, Clock, Ban, DollarSign, TrendingUp, Loader2, AlertTriangle, Eye } from "lucide-react";
import { DateRangePicker } from "@/components/date-range-picker";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { InvestmentDetailsDialog } from "@/components/admin/investment-details-dialog";
import { InvestmentWithUser } from "@/ai/flows/get-all-investments-flow";
import { getAllInvestmentsAction } from "@/app/actions/investment";

const fundNames: Record<string, string> = {
    gold: "Gold",
    silver: "Silver",
    usdt: "USDT",
    bitcoin: "Bitcoin"
};

const statusNames: Record<string, string> = {
    pending: "Pending",
    active: "Active",
    completed: "Completed",
    rejected: "Rejected",
};

const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function AdminInvestmentsPageContent() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const [allInvestments, setAllInvestments] = useState<InvestmentWithUser[]>([]);
    const [filteredInvestments, setFilteredInvestments] = useState<InvestmentWithUser[]>([]);
    const [stats, setStats] = useState({ totalAmount: 0, pendingCount: 0, averageAmount: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedInvestmentId, setSelectedInvestmentId] = useState<string | null>(null);
    
    // Filters state
    const [searchTerm, setSearchTerm] = useState("");
    const [fundFilter, setFundFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        const searchFromUrl = searchParams.get('search');
        if (searchFromUrl) {
            setSearchTerm(searchFromUrl);
        }
    }, [searchParams]);

    const fetchInvestments = useCallback(() => {
        setLoading(true);
        getAllInvestmentsAction()
            .then(data => {
                setAllInvestments(data.investments);
                
                const activeInvestments = data.investments.filter(inv => inv.status === 'active');
                const totalAmount = activeInvestments.reduce((sum, inv) => sum + inv.amountUSD, 0);
                const pendingCount = data.investments.filter(inv => inv.status === 'pending').length;
                const averageAmount = activeInvestments.length > 0 ? totalAmount / activeInvestments.length : 0;
                setStats({ totalAmount, pendingCount, averageAmount });
            })
            .catch(error => {
                console.error("Error fetching investments:", error);
                toast({
                    variant: "destructive",
                    title: "Error Fetching Data",
                    description: "There was a problem retrieving the investment list.",
                });
            })
            .finally(() => setLoading(false));
    }, [toast]);

    useEffect(() => {
        fetchInvestments();
    }, [fetchInvestments]);

    useEffect(() => {
        let result = allInvestments;

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            result = result.filter(inv => 
                inv.userFullName.toLowerCase().includes(lowercasedTerm) || 
                inv.userEmail.toLowerCase().includes(lowercasedTerm) ||
                inv.id.toLowerCase().includes(lowercasedTerm)
            );
        }

        if (fundFilter !== "all") {
            result = result.filter(inv => inv.fundId === fundFilter);
        }
        
        if (statusFilter !== "all") {
            result = result.filter(inv => inv.status === statusFilter);
        }

        setFilteredInvestments(result);
    }, [searchTerm, fundFilter, statusFilter, allInvestments]);


  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "rejected":
          return <Ban className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "secondary";
      case "pending":
        return "outline";
      case "completed":
        return "default";
      case "rejected":
          return "destructive";
      default:
        return "default";
    }
  };


  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Investment Management</h1>
      </div>

       <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active Investment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : (
                <div className="text-2xl font-bold font-mono">{formatCurrency(stats.totalAmount)}</div>
            )}
            <p className="text-xs text-muted-foreground">Sum of all approved investments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : (
                <div className="text-2xl font-bold">{stats.pendingCount.toLocaleString()}</div>
             )}
            <p className="text-xs text-muted-foreground">Needs admin approval or rejection</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Investment</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : (
                <div className="text-2xl font-bold font-mono">{formatCurrency(stats.averageAmount)}</div>
             )}
            <p className="text-xs text-muted-foreground">Average amount of active investments</p>
          </CardContent>
        </Card>
      </div>

       <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex-1">
                        <CardTitle>Investments List</CardTitle>
                        <CardDescription>
                            View and manage all investments on the platform.
                        </CardDescription>
                    </div>
                     <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-auto">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search user, email, ID..."
                                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline">
                           <FileDown className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>
                 <div className="flex flex-col md:flex-row items-center gap-2 mt-4">
                    <Select value={fundFilter} onValueChange={setFundFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Filter by fund" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Funds</SelectItem>
                            {Object.entries(fundNames).map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                    <DateRangePicker className="w-full md:w-auto" />
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead className="hidden md:table-cell">Fund</TableHead>
                             <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="hidden md:table-cell text-center">Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">
                                    <div className="flex justify-center items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin"/>
                                        <span>Loading investments...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredInvestments.length === 0 ? (
                             <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">
                                    No investments found with these filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredInvestments.map((inv) => (
                                <TableRow key={inv.id} className="cursor-pointer" onClick={() => setSelectedInvestmentId(inv.id)}>
                                    <TableCell>
                                        <div className="font-medium">{inv.userFullName}</div>
                                        <div className="text-xs text-muted-foreground">{inv.userEmail}</div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">{fundNames[inv.fundId] || inv.fundId}</TableCell>
                                    <TableCell className="text-right font-mono">
                                        {formatCurrency(inv.amountUSD)}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-center">
                                        {inv.createdAt}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(inv.status)}>
                                        <div className="flex items-center gap-2">
                                                {getStatusIcon(inv.status)}
                                                <span>{statusNames[inv.status] || inv.status}</span>
                                        </div>
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelectedInvestmentId(inv.id); }}>
                                            <Eye className="h-4 w-4" />
                                            <span className="sr-only">View Details</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
             <CardFooter>
                <div className="text-xs text-muted-foreground">
                    Showing <strong>{filteredInvestments.length}</strong> of <strong>{allInvestments.length}</strong> investments
                </div>
            </CardFooter>
       </Card>
        {selectedInvestmentId && (
            <InvestmentDetailsDialog 
                investmentId={selectedInvestmentId}
                open={!!selectedInvestmentId}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        setSelectedInvestmentId(null);
                    }
                }}
                onStatusChange={fetchInvestments}
            />
        )}
    </>
  );
}

// This is a wrapper component because hooks like useSearchParams can only be used in client components
// that are children of a <Suspense> boundary.
export default function AdminInvestmentsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AdminInvestmentsPageContent />
        </Suspense>
    )
}
