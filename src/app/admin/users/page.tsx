
"use client";

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
import { Search, MoreHorizontal, FileDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const users = [
  {
    id: "usr_1",
    name: "علی رضایی",
    email: "ali.rezaei@example.com",
    avatar: "/avatars/01.png",
    registrationDate: "۱۴۰۳/۰۴/۰۱",
    totalInvestment: 15000.00,
    status: "فعال",
  },
  {
    id: "usr_2",
    name: "مریم حسینی",
    email: "maryam.hosseini@example.com",
    avatar: "/avatars/02.png",
    registrationDate: "۱۴۰۳/۰۳/۲۰",
    totalInvestment: 5200.50,
    status: "فعال",
  },
  {
    id: "usr_3",
    name: "رضا محمدی",
    email: "reza.mohammadi@example.com",
    avatar: "/avatars/03.png",
    registrationDate: "۱۴۰۳/۰۲/۱۵",
    totalInvestment: 750.00,
    status: "مسدود شده",
  },
  {
    id: "usr_4",
    name: "سارا احمدی",
    email: "sara.ahmadi@example.com",
    avatar: "/avatars/04.png",
    registrationDate: "۱۴۰۳/۰۱/۱۰",
    totalInvestment: 25000.00,
    status: "فعال",
  },
  {
    id: "usr_5",
    name: "حسین کریمی",
    email: "hossein.karimi@example.com",
    avatar: "/avatars/05.png",
    registrationDate: "۱۴۰۲/۱۲/۰۵",
    totalInvestment: 0.00,
    status: "در انتظار تایید",
  },
];


export default function AdminUsersPage() {
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
                        {users.map((user) => (
                             <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <Avatar className="hidden h-9 w-9 sm:flex">
                                            <AvatarImage src={user.avatar} alt="Avatar" />
                                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="grid gap-1">
                                            <p className="text-sm font-medium leading-none">{user.name}</p>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">{user.registrationDate}</TableCell>
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
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
             <CardFooter>
                <div className="text-xs text-muted-foreground">
                    نمایش <strong>۱-۵</strong> از <strong>{users.length}</strong> کاربر
                </div>
                 {/* Pagination can be added here */}
            </CardFooter>
       </Card>
    </>
  );
}

