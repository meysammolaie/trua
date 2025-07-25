import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 justify-between">
        <h1 className="text-xl font-semibold">داشبورد</h1>
        <Button asChild>
          <Link href="/">خروج</Link>
        </Button>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>خوش آمدید!</CardTitle>
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
