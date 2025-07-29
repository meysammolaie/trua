
import { MousePointerClick, Ticket, TrendingUp, Wallet, DollarSign, PiggyBank, Briefcase } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

const steps = [
  {
    title: "1. Choose Fund & Invest",
    description: "Choose from our diverse funds and start with as little as $1.",
    icon: <MousePointerClick className="w-10 h-10 text-primary" />,
  },
  {
    title: "2. Earn Daily Profits",
    description: "Our AI calculates and deposits profits into your wallet daily.",
    icon: <TrendingUp className="w-10 h-10 text-primary" />,
  },
  {
    title: "3. Win the Monthly Lottery",
    description: "For every $10 invested, get a lottery ticket and win big prizes.",
    icon: <Ticket className="w-10 h-10 text-primary" />,
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="mb-12 text-center">
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
            Earn in Dollars in 3 Simple Steps
          </h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed">
            Our platform is designed for simplicity and transparency. Follow these steps to get started.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-3">
          {steps.map((step) => (
            <div key={step.title} className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-accent">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold font-headline mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
        
        {/* Transparency Section */}
        <div className="mt-24 md:mt-32">
             <div className="mb-12 text-center">
                <Badge variant="secondary">Transparency in Numbers</Badge>
                <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl mt-4">
                    How Your Capital Works For You
                </h2>
                <p className="mx-auto max-w-[800px] text-muted-foreground md:text-xl/relaxed">
                    At Trusva, fees don't go into the platform's pocket. They fuel the profit engine, returning to the public profit pool to be distributed among investors. The more investors and transactions, the larger this pool grows, increasing daily profits for everyone.
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                 <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                                <DollarSign className="w-6 h-6 text-primary"/>
                            </div>
                            <div>
                                <CardTitle>1. Initial Investment</CardTitle>
                                <CardDescription>Deposit $1,000 into one of the funds</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-2 text-sm">
                        <div className="flex justify-between"><span>Deposit Amount:</span> <span className="font-mono font-bold">$1,000.00</span></div>
                        <div className="flex justify-between text-red-400"><span>Entry Fee (3%):</span> <span className="font-mono">-$30.00</span></div>
                        <div className="flex justify-between text-red-400"><span>Lottery Fee (2%):</span> <span className="font-mono">-$20.00</span></div>
                        <div className="flex justify-between text-red-400"><span>Platform Fee (1%):</span> <span className="font-mono">-$10.00</span></div>
                        <hr className="border-dashed my-2"/>
                        <div className="flex justify-between font-bold text-lg"><span>Your Net Active Capital:</span> <span className="font-mono text-green-400">$940.00</span></div>
                    </CardContent>
                </Card>
                <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                                <PiggyBank className="w-6 h-6 text-primary"/>
                            </div>
                            <div>
                                <CardTitle>2. Profit Growth Potential</CardTitle>
                                <CardDescription>Balance increase with platform growth</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-2 text-sm">
                        <p className="text-muted-foreground">Assuming the daily distributed profit of the platform is 1.5% (this number is an example and depends on total user activity):</p>
                        <div className="flex justify-between"><span>Your Daily Profit (current):</span> <span className="font-mono font-bold text-green-400">~ $14.10</span></div>
                        <div className="flex justify-between"><span>Your Daily Profit (with 5,000 users):</span> <span className="font-mono font-bold text-green-400">~ $70.50</span></div>
                        <div className="flex justify-between"><span>Your Daily Profit (with 20,000 users):</span> <span className="font-mono font-bold text-green-400">~ $282.00</span></div>
                        <p className="text-muted-foreground pt-2">Profits are added to your wallet daily and are withdrawable at any time.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
        
        {/* Liquidity Section */}
        <div className="mt-24 md:mt-32">
             <div className="mb-12 text-center">
                <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl mt-4">
                   Liquidity: Power in Your Hands
                </h2>
                <p className="mx-auto max-w-[800px] text-muted-foreground md:text-xl/relaxed">
                    At Trusva, you have complete control over your capital. Whenever you decide, you can liquidate your active principal and return it to your wallet.
                </p>
            </div>

            <div className="grid gap-8 max-w-md mx-auto">
                 <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                                <Wallet className="w-6 h-6 text-primary"/>
                            </div>
                            <div>
                                <CardTitle>Capital Return</CardTitle>
                                <CardDescription>Example of exiting an investment</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-2 text-sm">
                        <p className="text-muted-foreground">Suppose you decide to liquidate your $940 investment:</p>
                        <div className="flex justify-between"><span>Your active capital:</span> <span className="font-mono font-bold">$940.00</span></div>
                        <div className="flex justify-between text-red-400"><span>Exit Fee (2%):</span> <span className="font-mono">-$18.80</span></div>
                        <hr className="border-dashed my-2"/>
                        <div className="flex justify-between font-bold text-lg"><span>Final amount returned to wallet:</span> <span className="font-mono text-green-400">$921.20</span></div>
                        <p className="text-muted-foreground pt-2">This amount is immediately added to your wallet and is available for withdrawal. The exit fee is also added to the profit pool for other users.</p>
                    </CardContent>
                </Card>
            </div>
        </div>

      </div>
    </section>
  );
}
