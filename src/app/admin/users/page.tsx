
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
import { getAllUsers, User } from "@/ai/flows/get-all-users-flow";
import { updateUserStatus } from "@/ai/flows/update-user-status-flow";
import { useToast } from "@/hooks/use-toast";

export default function AdminUsersPage() {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();

    const fetchUsers = useCallback(() => {
        setLoading(true);
        getAllUsers()
            .then(response => {
                setAllUsers(response.users);
                setFilteredUsers(response.users);
            })
            .catch(error => {
                console.error("Failed to fetch users:", error);
                toast({
                    variant: "destructive",
                    title: "خطا در واکشی کاربران",
                    description: "مشکلی در ارتباط با سرور رخ داد."
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
        const actionText = newStatus === 'active' ? 'فعال' : 'مسدود';
        try {
            const result = await updateUserStatus({ userId: user.uid, newStatus: newStatus });
            if (result.success) {
                toast({
                    title: `کاربر ${actionText} شد`,
                    description: result.message,
                });
                fetchUsers(); // Refresh the user list
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
             toast({
                variant: "destructive",
                title: `خطا در ${actionText} کردن کاربر`,
                description: error instanceof Error ? error.message : "یک خطای ناشناخته رخ داد.",
            });
        }
    };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">مدیریت کاربران</h1>
      </div>
       <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex-1 text-right">
                        <CardTitle>کاربران</CardTitle>
                        <CardDescription>
                            لیست کاربران پلتفرم را مشاهده و مدیریت کنید.
                        </CardDescription>
                    </div>
                     <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-auto">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="جستجوی کاربر..."
                                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline">
                           <FileDown className="h-4 w-4 ml-2" />
                            دریافت خروجی
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>کاربر</TableHead>
                            <TableHead className="hidden md:table-cell">تاریخ ثبت‌نام</TableHead>
                            <TableHead className="hidden md:table-cell">مجموع سرمایه</TableHead>
                            <TableHead>وضعیت</TableHead>
                            <TableHead>
                                <span className="sr-only">عملیات</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                    <div className="flex justify-center items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin"/>
                                        <span>در حال بارگذاری کاربران...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                    هیچ کاربری با این مشخصات یافت نشد.
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
                                    <TableCell className="hidden md:table-cell">{user.createdAt}</TableCell>
                                    <TableCell className="hidden md:table-cell font-mono">
                                        ${user.totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.status === 'active' ? 'secondary' : 'destructive'}>
                                            {user.status === 'active' ? 'فعال' : 'مسدود شده'}
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
                                                <DropdownMenuLabel>عملیات</DropdownMenuLabel>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/users/${user.uid}`}>مشاهده جزئیات</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem disabled>ویرایش کاربر</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {user.status === 'active' ? (
                                                     <DropdownMenuItem className="text-red-500" onClick={() => handleToggleStatus(user)}>
                                                        <UserX className="ml-2 h-4 w-4" />
                                                        مسدود کردن
                                                    </DropdownMenuItem>
                                                ) : (
                                                     <DropdownMenuItem className="text-green-500" onClick={() => handleToggleStatus(user)}>
                                                        <UserCheck className="ml-2 h-4 w-4" />
                                                        فعال کردن
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
                    نمایش <strong>{filteredUsers.length}</strong> از <strong>{allUsers.length}</strong> کاربر
                </div>
                 {/* Pagination can be added here */}
            </CardFooter>
       </Card>
    </>
  );
}
