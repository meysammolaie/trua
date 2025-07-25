import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bitcoin, Crown, Landmark, Medal } from "lucide-react";

const funds = [
  {
    name: "Gold Fund",
    description: "Invest in the timeless stability of gold. A safe haven for your assets.",
    icon: <Crown className="w-8 h-8 text-primary" />,
  },
  {
    name: "Silver Fund",
    description: "Diversify with silver, a precious metal with strong industrial demand.",
    icon: <Medal className="w-8 h-8 text-primary" />,
  },
  {
    name: "USD Fund",
    description: "Anchor your portfolio with the world's leading reserve currency.",
    icon: <Landmark className="w-8 h-8 text-primary" />,
  },
  {
    name: "Bitcoin Fund",
    description: "Embrace the future of finance by investing in the original cryptocurrency.",
    icon: <Bitcoin className="w-8 h-8 text-primary" />,
  },
];

export function FundsSection() {
  return (
    <section id="funds" className="w-full py-12 md:py-24 lg:py-32 bg-card">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
              Choose Your Investment Fund
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              We offer four distinct funds to match your investment strategy, from traditional assets to digital currencies.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 sm:grid-cols-2 md:gap-12 lg:grid-cols-4">
          {funds.map((fund) => (
            <Card key={fund.name} className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <CardHeader className="flex flex-col items-center text-center space-y-4">
                {fund.icon}
                <CardTitle className="font-headline text-xl">{fund.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">
                  {fund.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
