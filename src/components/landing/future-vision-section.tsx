
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Rocket, Sparkles, Gift } from "lucide-react";
import Link from "next/link";

const visionPoints = [
    {
        icon: <Rocket className="w-8 h-8 mb-4 text-primary"/>,
        title: "توسعه بی‌پایان",
        description: "ما متعهد به رشد دائمی هستیم. به زودی صندوق‌ها و مدل‌های درآمدزایی جدیدی مانند استیکینگ و وام‌دهی به پلتفرم اضافه خواهند شد."
    },
    {
        icon: <Sparkles className="w-8 h-8 mb-4 text-primary"/>,
        title: "هوش مصنوعی پیشرفته‌تر",
        description: "تیم ما به طور مداوم در حال بهبود الگوریتم‌های هوش مصنوعی برای بهینه‌سازی سود و افزایش امنیت سرمایه‌های شماست."
    },
    {
        icon: <Gift className="w-8 h-8 mb-4 text-primary"/>,
        title: "پاداش به وفاداری",
        description: "کاربران اولیه و وفادار ما همیشه در اولویت هستند. منتظر برنامه‌های تشویقی و سورپرایزهای ویژه برای همراهان قدیمی باشید."
    }
]

export function FutureVisionSection() {
  return (
    <section id="vision" className="w-full py-12 md:py-24 lg:py-32 bg-background/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <div className="space-y-4">
            <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
              آینده‌ای که با هم می‌سازیم
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed">
              خزانه سرسبز یک پروژه تمام‌شده نیست، بلکه یک اکوسیستم در حال تکامل است. ما برای آینده برنامه‌های بزرگی داریم.
            </p>
          </div>
          <div className="grid gap-8 pt-8 sm:grid-cols-1 md:grid-cols-3">
            {visionPoints.map(point => (
                <div key={point.title} className="flex flex-col items-center p-4">
                    {point.icon}
                    <h3 className="text-xl font-bold mb-2">{point.title}</h3>
                    <p className="text-muted-foreground">{point.description}</p>
                </div>
            ))}
          </div>
          <Button asChild size="lg" className="mt-8">
            <Link href="/signup">به آینده سرمایه‌گذاری بپیوندید</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
