
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
            title: "خطا در واکشی اطلاعات",
            description: "مشکلی در دریافت گزارشات معرفی شما رخ داد.",
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
      title: "کپی شد!",
      description: "کد معرف شما در کلیپ‌بورد کپی شد.",
    });
  };

  const copyReferralLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast({
        title: "کپی شد!",
        description: "لینک معرف شما در کلیپ‌بورد کپی شد."
    });
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="mr-4">در حال بارگذاری اطلاعات معرفی‌ها...</p>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center">اطلاعاتی برای نمایش وجود ندارد.</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">معرفی‌ها</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>کد و لینک معرف شما</CardTitle>
            <CardDescription>کد یا لینک زیر را با دوستانتان به اشتراک بگذارید.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">کد معرف</p>
              <div className="flex items-center gap-2">
                <Input readOnly value={data.referralCode} dir="ltr" className="font-mono text-lg tracking-widest"/>
                <Button type="button" variant="outline" size="icon" onClick={copyReferralCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
             <div>
              <p className="text-sm font-medium mb-2">لینک معرف</p>
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
            <CardTitle className="text-sm font-medium">مجموع کمیسیون دریافتی</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{formatCurrency(data.stats.totalCommissionEarned)}</div>
            <p className="text-xs text-muted-foreground">از تمام معرفی‌های شما</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تعداد کل معرفی‌ها</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalReferredUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">تعداد کاربرانی که با کد شما ثبت‌نام کرده‌اند</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>گزارش کمیسیون‌ها</CardTitle>
          <CardDescription>لیست کاربرانی که توسط شما معرفی شده و سرمایه‌گذاری کرده‌اند.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>کاربر معرفی شده</TableHead>
                <TableHead>تاریخ کمیسیون</TableHead>
                <TableHead className="text-right">مبلغ کمیسیون</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.referrals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10">
                    هنوز هیچ کمیسیونی از معرفی‌های شما ثبت نشده است.
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
                نمایش <strong>{data.referrals.length}</strong> رکورد
            </div>
        </CardFooter>
      </Card>
    </>
  );
}
