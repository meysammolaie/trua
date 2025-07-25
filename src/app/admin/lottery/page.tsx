
"use client";

import { useState } from "react";
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
import { Ticket, Users, DollarSign, PlayCircle, History, Loader2 } from "lucide-react";
import { CountdownTimer } from "@/components/countdown-timer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { runLotteryDraw } from "@/ai/flows/lottery-flow";


const lotteryStats = {
    pool: 25500.00,
    tickets: 18432,
    participants: 4321,
};

const recentWinners = [
  { drawDate: "۱۴۰۳/۰۴/۰۱", user: "سارا احمدی", avatar: "/avatars/04.png", prize: 5000.00, txId: "TXN-WIN-001" },
  { drawDate: "۱۴۰۳/۰۳/۰۱", user: "علی رضایی", avatar: "/avatars/01.png", prize: 4500.00, txId: "TXN-WIN-002" },
  { drawDate: "۱۴۰۳/۰۲/۰۱", user: "مریم حسینی", avatar: "/avatars/02.png", prize: 5200.00, txId: "TXN-WIN-003" },
];

export default function AdminLotteryPage() {
    const { toast } = useToast();
    const [isDrawing, setIsDrawing] = useState(false);

    const handleManualDraw = async () => {
        setIsDrawing(true);
        toast({
            title: "عملیات در حال انجام",
            description: "فرآیند اجرای دستی قرعه‌کشی آغاز شد...",
        });
        
        try {
            const result = await runLotteryDraw({});
            if (result.success) {
                toast({
                    title: "قرعه‌کشی با موفقیت انجام شد!",
                    description: `برنده: ${result.winnerName} | جایزه: $${result.prizeAmount.toLocaleString()}`,
                });
                // Optionally, you could add the new winner to the recentWinners list here
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "خطا در اجرای قرعه‌کشی",
                description: error instanceof Error ? error.message : "مشکلی در ارتباط با سرور رخ داد.",
            });
        } finally {
            setIsDrawing(false);
        }
    }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">مدیریت قرعه‌کشی</h1>
      </div>

       <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">موجودی صندوق قرعه‌کشی</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">${lotteryStats.pool.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              مربوط به دوره فعلی
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تعداد کل بلیت‌ها</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lotteryStats.tickets.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +1,250 در ۲۴ ساعت گذشته
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تعداد شرکت‌کنندگان</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lotteryStats.participants.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +82 کاربر جدید در این دوره
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>قرعه‌کشی بعدی</CardTitle>
                <CardDescription>زمان باقی‌مانده تا پایان دوره و انجام قرعه‌کشی بعدی.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="w-full max-w-md mx-auto py-4">
                    <CountdownTimer />
                </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
                 <Button onClick={handleManualDraw} className="w-full" disabled={isDrawing}>
                    {isDrawing ? (
                        <Loader2 className="h-4 w-4 ml-2 animate-spin"/>
                    ) : (
                        <PlayCircle className="h-4 w-4 ml-2"/>
                    )}
                    {isDrawing ? "در حال اجرا..." : "اجرای دستی قرعه‌کشی"}
                 </Button>
            </CardFooter>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>
                    <div className="flex items-center gap-2">
                        <History className="h-5 w-5"/>
                        <span>برندگان اخیر</span>
                    </div>
                </CardTitle>
                <CardDescription>
                    لیست برندگان خوش‌شانس دوره‌های قبل.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>کاربر</TableHead>
                            <TableHead>تاریخ</TableHead>
                            <TableHead className="text-right">مبلغ جایزه</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {recentWinners.map((winner) => (
                             <TableRow key={winner.txId}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="hidden h-9 w-9 sm:flex">
                                            <AvatarImage src={winner.avatar} alt="Avatar" />
                                            <AvatarFallback>{winner.user.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <p className="text-sm font-medium leading-none">{winner.user}</p>
                                    </div>
                                </TableCell>
                                <TableCell>{winner.drawDate}</TableCell>
                                <TableCell className="text-right font-mono text-green-600">
                                    ${winner.prize.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
