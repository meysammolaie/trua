
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, MoreHorizontal, FileDown, CheckCircle, Clock, XCircle, ArrowRightLeft, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
import { DateRangePicker } from "@/components/date-range-picker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { TransactionWithUser } from "@/ai/flows/get-all-transactions-flow";
import { getAllTransactionsAction } from "@/app/actions/transactions";
import Link from "next/link";
import { DateRange } from "react-day-picker";


const typeNames: Record<string, string> = {
    all: "All Types",
    investment: "Investment",
    withdrawal_request: "Withdrawal",
    profit_payout: "Profit",
    commission: "Commission",
    bonus: "Bonus",
    principal_return: "Principal Return"
};

const statusNames: Record<string, string> = {
    all: "All Statuses",
    pending: "Pending",
    active: "Active",
    completed: "Completed",
    failed: "Failed",
    rejected: "Rejected",
    refunded: "Refunded",
};

const formatCurrency = (amount: number) => `$${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AdminTransactionsPage() {
    const { toast } = useToast();
    const [allTransactions, setAllTransactions] = useState<TransactionWithUser[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<TransactionWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters state
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateRange, setDateRange] = useState<DateRange | undefined>();


    useEffect(() => {
        setLoading(true);
        getAllTransactionsAction()
            .then(data => {
                setAllTransactions(data.transactions);
                setFilteredTransactions(data.transactions);
            })
            .catch(error => {
                console.error("Error fetching transactions:", error);
                toast({
                    variant: "destructive",
                    title: "Error Fetching Data",
                    description: "There was a problem retrieving the transaction list.",
                });
            })
            .finally(() => setLoading(false));
    }, [toast]);

    useEffect(() => {
        let result = allTransactions;

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            result = result.filter(tx => 
                tx.userFullName.toLowerCase().includes(lowercasedTerm) || 
                tx.userEmail.toLowerCase().includes(lowercasedTerm) ||
                tx.id.toLowerCase().includes(lowercasedTerm)
            );
        }

        if (typeFilter !== "all") {
             result = result.filter(tx => tx.type === typeFilter);
        }
        
        if (statusFilter !== "all" && statusFilter) {
            result = result.filter(tx => tx.status === statusFilter);
        }

        if (dateRange?.from && dateRange?.to) {
            result = result.filter(req => {
                const reqDate = req.createdAtTimestamp;
                 const toDate = new Date(dateRange.to!);
                toDate.setHours(23, 59, 59, 999);
                return reqDate >= dateRange.from!.getTime() && reqDate <= toDate.getTime();
            });
        }

        setFilteredTransactions(result);
    }, [searchTerm, typeFilter, statusFilter, dateRange, allTransactions]);
    

    const getStatusIcon = (status?: string) => {
        switch (status) {
        case "completed":
        case "active":
        case "refunded":
            return <CheckCircle className="h-4 w-4 text-green-500" />;
        case "pending":
            return <Clock className="h-4 w-4 text-yellow-500" />;
        case "failed":
        case "rejected":
            return <XCircle className="h-4 w-4 text-red-500" />;
        default:
            return null;
        }
    };

    const getStatusBadgeVariant = (status?: string) => {
        switch (status) {
        case "completed":
        case "active":
        case "refunded":
            return "secondary";
        case "pending":
            return "outline";
        case "failed":
        case "rejected":
            return "destructive";
        default:
            return "default";
        }
    };

    const getTransactionTypeName = (type: string) => {
        return typeNames[type] || type;
    }


  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Transaction Management</h1>
      </div>

       <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-6 w-6 animate-spin"/> :
                <div className="text-2xl font-bold">{allTransactions.length.toLocaleString()}</div>
            }
            <p className="text-xs text-muted-foreground">
              All financial and system events
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loading ? <Loader2 className="h-6 w-6 animate-spin"/> :
                <div className="text-2xl font-bold">{allTransactions.filter(t => ['completed', 'active'].includes(t.status || '')).length.toLocaleString()}</div>
             }
            <p className="text-xs text-muted-foreground">
             Completed and active transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Transactions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loading ? <Loader2 className="h-6 w-6 animate-spin"/> :
                <div className="text-2xl font-bold">{allTransactions.filter(t => t.status === 'pending').length.toLocaleString()}</div>
             }
            <p className="text-xs text-muted-foreground">
               Requires review and approval
            </p>
          </CardContent>
        </Card>
      </div>

       <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex-1">
                        <CardTitle>All Transactions List</CardTitle>
                        <CardDescription>
                            View and manage all financial transactions on the platform.
                        </CardDescription>
                    </div>
                     <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-auto">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by user or ID..."
                                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline">
                           <FileDown className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>
                 <div className="flex flex-col md:flex-row items-center gap-2 mt-4 flex-wrap">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-full sm:w-auto flex-grow sm:flex-grow-0 sm:w-[180px]">
                            <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {Object.entries(typeNames).map(([value, name]) => value !== 'all' && <SelectItem key={value} value={value}>{name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-auto flex-grow sm:flex-grow-0 sm:w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {Object.entries(statusNames).map(([value, name]) => value !== 'all' && <SelectItem key={value} value={value}>{name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <DateRangePicker onDateChange={setDateRange} className="w-full sm:w-auto flex-grow sm:flex-grow-0" />
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead className="hidden sm:table-cell">Type</TableHead>
                            <TableHead className="hidden md:table-cell">Status</TableHead>
                             <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="hidden lg:table-cell text-center">Date</TableHead>
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
                                        <span>Loading transactions...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                         ) : filteredTransactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">
                                    No transactions found with these filters.
                                </TableCell>
                            </TableRow>
                         ) : (
                            filteredTransactions.map((tx) => (
                                <TableRow key={tx.id}>
                                <TableCell>
                                    <div className="font-medium">{tx.userFullName}</div>
                                    <div className="text-xs text-muted-foreground">{tx.userEmail}</div>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">{getTransactionTypeName(tx.type)}</TableCell>
                                <TableCell className="hidden md:table-cell">
                                    <Badge variant={getStatusBadgeVariant(tx.status)}>
                                    <div className="flex items-center gap-2">
                                            {getStatusIcon(tx.status)}
                                            <span>{statusNames[tx.status || 'all'] || tx.status}</span>
                                    </div>
                                    </Badge>
                                </TableCell>
                                <TableCell className={`text-right font-mono ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                </TableCell>
                                <TableCell className="hidden lg:table-cell text-center">{tx.createdAt}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem disabled>View Transaction Details</DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                               <Link href={`/admin/users/${tx.userId}`}>View User Profile</Link>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
             <CardFooter>
                <div className="text-xs text-muted-foreground">
                    Showing <strong>{filteredTransactions.length}</strong> of <strong>{allTransactions.length}</strong> transactions
                </div>
                 {/* Pagination can be added here */}
            </CardFooter>
       </Card>
    </>
  );
}
