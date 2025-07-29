
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, FileDown, Loader2, UserX, UserCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/ai/flows/get-all-users-flow";
import { getAllUsersAction } from "@/app/actions/users";
import { updateUserStatusAction } from "@/app/actions/user-status";
import { useToast } from "@/hooks/use-toast";

const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AdminUsersPage() {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();

    const fetchUsers = useCallback(() => {
        setLoading(true);
        getAllUsersAction()
            .then(response => {
                setAllUsers(response.users);
                setFilteredUsers(response.users);
            })
            .catch(error => {
                console.error("Failed to fetch users:", error);
                toast({
                    variant: "destructive",
                    title: "Error fetching users",
                    description: "A server error occurred."
                })
            })
            .finally(() => {
                setLoading(false);
            });
    }, [toast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filteredData = allUsers.filter(item => {
            return (
                item.firstName.toLowerCase().includes(lowercasedFilter) ||
                item.lastName.toLowerCase().includes(lowercasedFilter) ||
                item.email.toLowerCase().includes(lowercasedFilter)
            );
        });
        setFilteredUsers(filteredData);
    }, [searchTerm, allUsers]);

    const handleToggleStatus = async (user: User) => {
        const newStatus = user.status === 'active' ? 'blocked' : 'active';
        const actionText = newStatus === 'active' ? 'unblock' : 'block';
        try {
            const result = await updateUserStatusAction({ userId: user.uid, newStatus: newStatus });
            if (result.success) {
                toast({
                    title: `User ${actionText}ed`,
                    description: result.message,
                });
                fetchUsers(); // Refresh the user list
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
             toast({
                variant: "destructive",
                title: `Error ${actionText}ing user`,
                description: error instanceof Error ? error.message : "An unknown error occurred.",
            });
        }
    };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">User Management</h1>
      </div>
       <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex-1">
                        <CardTitle>Users</CardTitle>
                        <CardDescription>
                            View and manage the list of platform users.
                        </CardDescription>
                    </div>
                     <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-auto">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search users..."
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
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead className="hidden lg:table-cell">Registration Date</TableHead>
                            <TableHead className="hidden md:table-cell text-right">Total Investment</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                    <div className="flex justify-center items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin"/>
                                        <span>Loading users...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                    No users found with these criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.uid}>
                                    <TableCell>
                                        <div className="flex items-center gap-4">
                                            <Avatar className="hidden h-9 w-9 sm:flex">
                                                <AvatarImage src={`https://i.pravatar.cc/40?u=${user.uid}`} alt="Avatar" />
                                                <AvatarFallback>{user.firstName?.charAt(0)}{user.lastName?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="grid gap-1">
                                                <p className="text-sm font-medium leading-none">{user.firstName} {user.lastName}</p>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">{user.createdAt}</TableCell>
                                    <TableCell className="hidden md:table-cell font-mono text-right">
                                        {formatCurrency(user.totalInvestment)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.status === 'active' ? 'secondary' : 'destructive'}>
                                            {user.status === 'active' ? 'Active' : 'Blocked'}
                                        </Badge>
                                    </TableCell>
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
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/users/${user.uid}`}>View Details</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem disabled>Edit User</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {user.status === 'active' ? (
                                                     <DropdownMenuItem className="text-red-500" onClick={() => handleToggleStatus(user)}>
                                                        <UserX className="mr-2 h-4 w-4" />
                                                        Block
                                                    </DropdownMenuItem>
                                                ) : (
                                                     <DropdownMenuItem className="text-green-500" onClick={() => handleToggleStatus(user)}>
                                                        <UserCheck className="mr-2 h-4 w-4" />
                                                        Unblock
                                                    </DropdownMenuItem>
                                                )}
                                               
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
                    Showing <strong>{filteredUsers.length}</strong> of <strong>{allUsers.length}</strong> users
                </div>
                 {/* Pagination can be added here */}
            </CardFooter>
       </Card>
    </>
  );
}
