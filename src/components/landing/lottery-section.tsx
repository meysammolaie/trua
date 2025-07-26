import { Button } from "@/components/ui/button";
import { CountdownTimer } from "@/components/countdown-timer";
import Link from "next/link";

export function LotterySection() {
  return (
    <section id="lottery" className="w-full py-12 md:py-24 lg:py-32 bg-background/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <div className="space-y-4">
            <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
              قرعه‌کشی بزرگ ماهانه: شانس شما برای یک برد بزرگ!
            </h2>
            <p className="mx-auto max-w-[800px] text-muted-foreground md:text-xl/relaxed">
              در Trusva، هر سرمایه‌گذاری یک فرصت است. ۲٪ از کارمزد تمام تراکنش‌ها مستقیماً به استخر جایزه قرعه‌کشی ما واریز می‌شود. این یعنی هرچه جامعه سرمایه‌گذاران ما فعال‌تر باشد، جایزه ماهانه بزرگتر و هیجان‌انگیزتر خواهد بود!
              <br />
              به ازای هر ۱۰ دلار سرمایه‌گذاری، یک بلیت شانس دریافت کنید. قرعه‌کشی بعدی نزدیک است!
            </p>
          </div>
          <div className="w-full max-w-2xl py-8">
            <CountdownTimer />
          </div>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
            <Link href="/signup">اکنون سرمایه‌گذاری کنید و بلیت بگیرید</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
