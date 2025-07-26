import { MousePointerClick, Ticket, TrendingUp, Wallet, DollarSign, PiggyBank, Briefcase } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

const steps = [
  {
    title: "۱. انتخاب صندوق و سرمایه‌گذاری",
    description: "از بین صندوق‌های متنوع ما انتخاب کرده و با حداقل ۱ دلار شروع کنید.",
    icon: <MousePointerClick className="w-10 h-10 text-primary" />,
  },
  {
    title: "۲. کسب سود روزانه",
    description: "هوش مصنوعی ما به صورت روزانه سود را محاسبه و به کیف پول شما واریز می‌کند.",
    icon: <TrendingUp className="w-10 h-10 text-primary" />,
  },
  {
    title: "۳. شانس در قرعه‌کشی ماهانه",
    description: "به ازای هر ۱۰ دلار سرمایه‌گذاری، یک بلیت قرعه‌کشی دریافت کرده و برنده جوایز بزرگ شوید.",
    icon: <Ticket className="w-10 h-10 text-primary" />,
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="mb-12 text-center">
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
            در ۳ مرحله ساده به درآمد دلاری برسید
          </h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed">
            پلتفرم ما برای سادگی و شفافیت طراحی شده است. برای شروع این مراحل را دنبال کنید.
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
                <Badge variant="secondary">شفافیت در اعداد</Badge>
                <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl mt-4">
                    سرمایه شما چگونه برای شما کار می‌کند؟
                </h2>
                <p className="mx-auto max-w-[800px] text-muted-foreground md:text-xl/relaxed">
                    در Trusva، کارمزدها به جیب پلتفرم نمی‌رود، بلکه به عنوان سوخت موتور سودآوری، به استخر سود عمومی بازگشته و بین خود سرمایه‌گذاران توزیع می‌شود. هرچه تعداد سرمایه‌گذاران و تراکنش‌ها بیشتر شود، این استخر بزرگتر شده و سود روزانه همه افزایش می‌یابد.
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
                                <CardTitle>۱. سرمایه‌گذاری اولیه</CardTitle>
                                <CardDescription>واریز ۱۰۰۰ دلار به یکی از صندوق‌ها</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-2 text-sm">
                        <div className="flex justify-between"><span>مبلغ واریزی:</span> <span className="font-mono font-bold">$۱۰۰۰.۰۰</span></div>
                        <div className="flex justify-between text-red-400"><span>کارمزد ورود (۳٪):</span> <span className="font-mono">-$۳۰.۰۰</span></div>
                        <div className="flex justify-between text-red-400"><span>کارمزد قرعه‌کشی (۲٪):</span> <span className="font-mono">-$۲۰.۰۰</span></div>
                        <div className="flex justify-between text-red-400"><span>کارمزد پلتفرم (۱٪):</span> <span className="font-mono">-$۱۰.۰۰</span></div>
                        <hr className="border-dashed my-2"/>
                        <div className="flex justify-between font-bold text-lg"><span>سرمایه خالص فعال شما:</span> <span className="font-mono text-green-400">$۹۴۰.۰۰</span></div>
                    </CardContent>
                </Card>
                <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                                <PiggyBank className="w-6 h-6 text-primary"/>
                            </div>
                            <div>
                                <CardTitle>۲. پتانسیل رشد سود</CardTitle>
                                <CardDescription>افزایش موجودی با رشد پلتفرم</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-2 text-sm">
                        <p className="text-muted-foreground">فرض کنید سود توزیعی روزانه پلتفرم ۱.۵٪ باشد (این عدد صرفا مثال است و به فعالیت کل کاربران بستگی دارد):</p>
                        <div className="flex justify-between"><span>سود روزانه شما (با سرمایه فعلی):</span> <span className="font-mono font-bold text-green-400">~ $۱۴.۱۰</span></div>
                        <div className="flex justify-between"><span>سود روزانه شما (با ۵,۰۰۰ کاربر فعال):</span> <span className="font-mono font-bold text-green-400">~ $۷۰.۵۰</span></div>
                        <div className="flex justify-between"><span>سود روزانه شما (با ۲۰,۰۰۰ کاربر فعال):</span> <span className="font-mono font-bold text-green-400">~ $۲۸۲.۰۰</span></div>
                        <p className="text-muted-foreground pt-2">سود به صورت روزانه به کیف پول شما اضافه شده و هر لحظه قابل برداشت است.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
        
        {/* Liquidity Section */}
        <div className="mt-24 md:mt-32">
             <div className="mb-12 text-center">
                <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl mt-4">
                   نقدشوندگی: قدرت در دستان شماست
                </h2>
                <p className="mx-auto max-w-[800px] text-muted-foreground md:text-xl/relaxed">
                    در Trusva، شما کنترل کامل بر روی سرمایه خود دارید. هر زمان که تصمیم بگیرید، می‌توانید اصل سرمایه فعال خود را نقد کرده و به کیف پول خود بازگردانید.
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
                                <CardTitle>بازپرداخت سرمایه</CardTitle>
                                <CardDescription>مثال خروج از سرمایه‌گذاری</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-2 text-sm">
                        <p className="text-muted-foreground">فرض کنید تصمیم به نقد کردن سرمایه ۹۴۰ دلاری خود می‌گیرید:</p>
                        <div className="flex justify-between"><span>سرمایه فعال شما:</span> <span className="font-mono font-bold">$۹۴۰.۰۰</span></div>
                        <div className="flex justify-between text-red-400"><span>کارمزد خروج (۲٪):</span> <span className="font-mono">-$۱۸.۸۰</span></div>
                        <hr className="border-dashed my-2"/>
                        <div className="flex justify-between font-bold text-lg"><span>مبلغ نهایی بازگشتی به کیف پول:</span> <span className="font-mono text-green-400">$۹۲۱.۲۰</span></div>
                        <p className="text-muted-foreground pt-2">این مبلغ بلافاصله به کیف پول شما اضافه شده و قابل برداشت است. کارمزد خروج نیز به استخر سود سایر کاربران اضافه می‌شود.</p>
                    </CardContent>
                </Card>
            </div>
        </div>

      </div>
    </section>
  );
}
