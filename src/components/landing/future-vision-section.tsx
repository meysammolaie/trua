
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Rocket, Sparkles, Gift, Users } from "lucide-react";
import Link from "next/link";

const visionPoints = [
    {
        icon: <Rocket className="w-8 h-8 mb-4 text-primary"/>,
        title: "Endless Development",
        description: "We are committed to perpetual growth. New funds and income models like staking and lending will soon be added to the platform."
    },
     {
        icon: <Users className="w-8 h-8 mb-4 text-primary"/>,
        title: "Income from Referrals",
        description: "The more friends you refer, the more profit you earn directly from their investments, deposited straight into your wallet."
    },
    {
        icon: <Gift className="w-8 h-8 mb-4 text-primary"/>,
        title: "Loyalty Rewards",
        description: "Our early and loyal users are always a priority. Expect special incentive programs and surprises for our long-term supporters."
    }
]

export function FutureVisionSection() {
  return (
    <section id="vision" className="w-full py-12 md:py-24 lg:py-32 bg-background/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <div className="space-y-4">
            <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
              The Future We Build Together
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed">
              Trusva is not a finished project, but an evolving ecosystem. We have big plans for the future.
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
            <Link href="/signup">Join the Future of Investment</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
