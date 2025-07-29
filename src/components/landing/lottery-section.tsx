
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
              The Grand Monthly Lottery: Your Chance for a Big Win!
            </h2>
            <p className="mx-auto max-w-[800px] text-muted-foreground md:text-xl/relaxed">
              At Trusva, every investment is an opportunity. 2% of the fees from all transactions go directly into our lottery prize pool. This means the more active our investor community is, the bigger and more exciting the monthly prize will be!
              <br />
              Get one chance ticket for every $10 you invest. The next draw is approaching!
            </p>
          </div>
          <div className="w-full max-w-2xl py-8">
            <CountdownTimer />
          </div>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
            <Link href="/signup">Invest Now and Get Your Tickets</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
