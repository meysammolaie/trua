
"use client";

import { useState, useEffect } from "react";
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
} from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, FileDown, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAllUsers, User } from "@/ai/flows/get-all-users-flow";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAllUsers()
            .then(response => {
                setUsers(response.users);
            })
            .catch(error => {
                console.error("Failed to fetch users:", error);
                // TODO: Add toast notification for error
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

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
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                    هیچ کاربری یافت نشد.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.uid}>
                                    <TableCell>
                                        <div className="flex items-center gap-4">
                                            <Avatar className="hidden h-9 w-9 sm:flex">
                                                {/* In a real app, user.avatarUrl would be a field in the document */}
                                                <AvatarImage src={`/avatars/${(parseInt(user.uid, 36) % 5) + 1}.png`} alt="Avatar" />
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
                                        <Badge variant={user.status === 'فعال' ? 'secondary' : user.status === 'مسدود شده' ? 'destructive' : 'outline'}>
                                            {user.status}
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
                                                <DropdownMenuItem>مشاهده جزئیات</DropdownMenuItem>
                                                <DropdownMenuItem>ویرایش</DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600">مسدود کردن</DropdownMenuItem>
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
                    نمایش <strong>{users.length}</strong> کاربر
                </div>
                 {/* Pagination can be added here */}
            </CardFooter>
       </Card>
    </>
  );
}
