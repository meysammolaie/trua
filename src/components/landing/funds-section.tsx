import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bitcoin, Crown, Landmark, Medal } from "lucide-react";

const funds = [
  {
    name: "صندوق طلا",
    description: "در ثبات بی‌انتهای طلا سرمایه‌گذاری کنید. پناهگاهی امن برای دارایی‌های شما.",
    icon: <Crown className="w-8 h-8 text-primary" />,
  },
  {
    name: "صندوق نقره",
    description: "با نقره، یک فلز گرانبها با تقاضای صنعتی قوی، سبد خود را متنوع کنید.",
    icon: <Medal className="w-8 h-8 text-primary" />,
  },
  {
    name: "صندوق دلار",
    description: "سبد خود را با ارز ذخیره پیشرو در جهان تقویت کنید.",
    icon: <Landmark className="w-8 h-8 text-primary" />,
  },
  {
    name: "صندوق بیت‌کوین",
    description: "با سرمایه‌گذاری در ارز دیجیتال اصلی، آینده مالی را در آغوش بگیرید.",
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
              صندوق سرمایه‌گذاری خود را انتخاب کنید
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              ما چهار صندوق متمایز را برای تطابق با استراتژی سرمایه‌گذاری شما ارائه می‌دهیم، از دارایی‌های سنتی تا ارزهای دیجیتال.
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
