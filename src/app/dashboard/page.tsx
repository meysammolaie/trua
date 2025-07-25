
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "خروج موفق",
        description: "شما با موفقیت از حساب خود خارج شدید.",
      });
      router.push("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطا در خروج",
        description: "مشکلی در هنگام خروج از حساب کاربری رخ داد.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">در حال بارگذاری...</p>
      </div>
    );
  }

  if (!user) {
    // This will be handled by the useAuth hook redirect, but as a fallback:
    return null;
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 justify-between">
        <h1 className="text-xl font-semibold">داشبورد</h1>
        <Button onClick={handleLogout}>خروج</Button>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>خوش آمدید، {user.email}!</CardTitle>
            <CardDescription>
              اینجا داشبورد شماست. به زودی امکانات بیشتری اضافه خواهد شد.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>در حال حاضر در حال ساخت این بخش هستیم. به زودی می‌توانید سرمایه‌گذاری‌های خود را مدیریت کنید، سودهای خود را مشاهده کرده و در قرعه‌کشی‌ها شرکت کنید.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
