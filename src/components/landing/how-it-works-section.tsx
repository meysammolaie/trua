import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownToLine, MousePointerClick, Ticket, TrendingUp } from "lucide-react";

const steps = [
  {
    title: "1. Choose a Fund",
    description: "Select from Gold, Silver, USD, or Bitcoin to start your investment journey.",
    icon: <MousePointerClick className="w-10 h-10 text-primary" />,
  },
  {
    title: "2. Make a Deposit",
    description: "Easily deposit funds into your chosen pool, starting from just $1.",
    icon: <ArrowDownToLine className="w-10 h-10 text-primary" />,
  },
  {
    title: "3. Earn Daily Profits",
    description: "Receive your share of the daily profit pool, rewarding your investment.",
    icon: <TrendingUp className="w-10 h-10 text-primary" />,
  },
  {
    title: "4. Win the Lottery",
    description: "Automatically get lottery tickets for every $10 invested and win big.",
    icon: <Ticket className="w-10 h-10 text-primary" />,
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="mb-12 text-center">
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
            Start Investing in 4 Simple Steps
          </h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed">
            Our platform is designed for simplicity and transparency. Follow these steps to begin.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.title} className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/30">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold font-headline mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
