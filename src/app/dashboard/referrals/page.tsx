
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
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
import { Loader2, Gift, Users, Copy, Link as LinkIcon } from "lucide-react";
import { GetUserReferralsOutput } from "@/ai/flows/get-user-referrals-flow";
import { getUserReferralsAction } from "@/app/actions/referrals";
import { Badge } from "@/components/ui/badge";

type ReferralData = GetUserReferralsOutput;

const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ReferralsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (user) {
      setLoading(true);
      getUserReferralsAction({ userId: user.uid })
        .then(setData)
        .catch((error) => {
          console.error("Failed to fetch referral data:", error);
          toast({
            variant: "destructive",
            title: "Error Fetching Data",
            description: "There was a problem retrieving your referral data.",
          });
        })
        .finally(() => setLoading(false));
    }
  }, [user, toast]);
  
  const referralLink = isClient ? `${window.location.origin}/signup?ref=${data?.referralCode}` : "";

  const copyReferralCode = () => {
    if (!data?.referralCode) return;
    navigator.clipboard.writeText(data.referralCode);
    toast({
      title: "Copied!",
      description: "Your referral code has been copied to your clipboard.",
    });
  };

  const copyReferralLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast({
        title: "Copied!",
        description: "Your referral link has been copied to your clipboard."
    });
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="ml-4">Loading referral data...</p>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center">No data to display.</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Referrals</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Your Referral Code & Link</CardTitle>
            <CardDescription>Share the code or link below with your friends.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Referral Code</p>
              <div className="flex items-center gap-2">
                <Input readOnly value={data.referralCode} dir="ltr" className="font-mono text-lg tracking-widest"/>
                <Button type="button" variant="outline" size="icon" onClick={copyReferralCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
             <div>
              <p className="text-sm font-medium mb-2">Referral Link</p>
              <div className="flex items-center gap-2">
                <Input readOnly value={referralLink} dir="ltr" className="font-mono text-sm"/>
                <Button type="button" variant="outline" size="icon" onClick={copyReferralLink}>
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commission Earned</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{formatCurrency(data.stats.totalCommissionEarned)}</div>
            <p className="text-xs text-muted-foreground">From all of your referrals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalReferredUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Users who have signed up with your code</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission Report</CardTitle>
          <CardDescription>List of users you referred who have made an investment.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referred User</TableHead>
                <TableHead>Commission Date</TableHead>
                <TableHead className="text-right">Commission Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.referrals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10">
                    No commissions have been recorded from your referrals yet.
                  </TableCell>
                </TableRow>
              ) : (
                data.referrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell className="font-medium">{referral.referredUserName}</TableCell>
                    <TableCell>{referral.date}</TableCell>
                    <TableCell className="text-right font-mono text-green-500">
                        {formatCurrency(referral.commissionAmount)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
            <div className="text-xs text-muted-foreground">
                Showing <strong>{data.referrals.length}</strong> records
            </div>
        </CardFooter>
      </Card>
    </>
  );
}
