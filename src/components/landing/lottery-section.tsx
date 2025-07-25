import { Button } from "@/components/ui/button";
import { CountdownTimer } from "@/components/countdown-timer";

export function LotterySection() {
  return (
    <section id="lottery" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <div className="space-y-4">
            <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
              The Monthly Grand Lottery
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed">
              Invest $10 to get a ticket and stand a chance to win big. The next draw is approaching!
            </p>
          </div>
          <div className="w-full max-w-2xl py-8">
            <CountdownTimer />
          </div>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
            <a href="#funds">Invest Now & Get Tickets</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
