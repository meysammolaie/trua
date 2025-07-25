import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VerdantVaultLogo } from "@/components/icons";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-4 left-4">
         <Button variant="outline" asChild><Link href="/">بازگشت به خانه</Link></Button>
      </div>
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader className="text-center space-y-4">
          <Link href="/" className="flex justify-center">
            <VerdantVaultLogo className="h-12 w-12" />
          </Link>
          <CardTitle className="text-2xl font-headline">ایجاد حساب کاربری</CardTitle>
          <CardDescription>
            برای شروع سرمایه‌گذاری، اطلاعات خود را وارد کنید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2 text-right">
                <Label htmlFor="first-name">نام</Label>
                <Input id="first-name" placeholder="علی" required />
              </div>
              <div className="grid gap-2 text-right">
                <Label htmlFor="last-name">نام خانوادگی</Label>
                <Input id="last-name" placeholder="رضایی" required />
              </div>
            </div>
            <div className="grid gap-2 text-right">
              <Label htmlFor="email">ایمیل</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                dir="ltr"
              />
            </div>
            <div className="grid gap-2 text-right">
              <Label htmlFor="password">رمز عبور</Label>
              <Input id="password" type="password" required dir="ltr" />
            </div>
            <Button type="submit" className="w-full">
              ایجاد حساب
            </Button>
            <Button variant="outline" className="w-full">
              ثبت نام با گوگل
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            قبلاً ثبت‌نام کرده‌اید؟{" "}
            <Link href="/login" className="underline">
              وارد شوید
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
