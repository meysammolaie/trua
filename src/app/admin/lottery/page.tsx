
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
import { Button } from "@/components/ui/button";
import { Ticket, Users, DollarSign, PlayCircle, History, Loader2 } from "lucide-react";
import { CountdownTimer } from "@/components/countdown-timer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { LotteryData } from "@/ai/flows/get-lottery-data-flow";
import { getLotteryDataAction, runLotteryDrawAction } from "@/app/actions/lottery";

const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AdminLotteryPage() {
    const { toast } = useToast();
    const [isDrawing, setIsDrawing] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [lotteryData, setLotteryData] = useState<LotteryData | null>(null);

    const fetchLotteryData = async () => {
        try {
            setIsLoadingData(true);
            const data = await getLotteryDataAction();
            setLotteryData(data);
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Error Fetching Data",
                description: error instanceof Error ? error.message : "There was a problem retrieving lottery information.",
            });
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        fetchLotteryData();
    }, []);

    const handleManualDraw = async () => {
        setIsDrawing(true);
        toast({
            title: "Operation in Progress",
            description: "The manual lottery draw process has started...",
        });
        
        try {
            const result = await runLotteryDrawAction({});
            if (result.success) {
                toast({
                    title: "Lottery Draw Successful!",
                    description: result.message,
                });
                // Refresh data to show new stats and winner
                await fetchLotteryData(); 
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error Running Lottery",
                description: error instanceof Error ? error.message : "A server error occurred.",
            });
        } finally {
            setIsDrawing(false);
        }
    }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Lottery Management</h1>
      </div>

       <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lottery Pool Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoadingData ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                <div className="text-2xl font-bold font-mono">{formatCurrency(lotteryData?.lotteryPool ?? 0)}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Total lottery fees from investments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoadingData ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                <div className="text-2xl font-bold">{lotteryData?.totalTickets.toLocaleString()}</div>
             )}
            <p className="text-xs text-muted-foreground">
              Based on 1 ticket per $10 invested
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoadingData ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                <div className="text-2xl font-bold">{lotteryData?.participantsCount.toLocaleString()}</div>
             )}
            <p className="text-xs text-muted-foreground">
              Unique users with an investment
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Next Lottery Draw</CardTitle>
                <CardDescription>Time remaining until the end of the period and the next draw.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="w-full max-w-md mx-auto py-4">
                    <CountdownTimer />
                </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
                 <Button onClick={handleManualDraw} className="w-full" disabled={isDrawing || isLoadingData}>
                    {isDrawing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin"/>
                    ) : (
                        <PlayCircle className="h-4 w-4 mr-2"/>
                    )}
                    {isDrawing ? "Running..." : "Run Manual Draw"}
                 </Button>
            </CardFooter>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>
                    <div className="flex items-center gap-2">
                        <History className="h-5 w-5"/>
                        <span>Recent Winners</span>
                    </div>
                </CardTitle>
                <CardDescription>
                    List of lucky winners from previous rounds.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Prize Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingData ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-10">
                                    <Loader2 className="h-5 w-5 animate-spin mx-auto"/>
                                </TableCell>
                            </TableRow>
                        ) : lotteryData?.recentWinners && lotteryData.recentWinners.length > 0 ? (
                             lotteryData.recentWinners.map((winner) => (
                             <TableRow key={winner.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="hidden h-9 w-9 sm:flex">
                                            <AvatarImage src={`https://i.pravatar.cc/40?u=${winner.userId}`} alt="Avatar" />
                                            <AvatarFallback>{winner.userName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <p className="text-sm font-medium leading-none">{winner.userName}</p>
                                    </div>
                                </TableCell>
                                <TableCell>{winner.drawDate}</TableCell>
                                <TableCell className="text-right font-mono text-green-600">
                                    {formatCurrency(winner.prizeAmount)}
                                </TableCell>
                            </TableRow>
                        ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={3} className="text-center py-10">
                                    No winners have been recorded yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
