import { ArrowDownToLine, MousePointerClick, Ticket, TrendingUp } from "lucide-react";

const steps = [
  {
    title: "۱. یک صندوق انتخاب کنید",
    description: "از بین طلا، نقره، دلار یا بیت‌کوین برای شروع سفر سرمایه‌گذاری خود انتخاب کنید.",
    icon: <MousePointerClick className="w-10 h-10 text-primary" />,
  },
  {
    title: "۲. واریز وجه",
    description: "به راحتی وجوه را به استخر انتخابی خود واریز کنید، شروع از فقط ۱ دلار.",
    icon: <ArrowDownToLine className="w-10 h-10 text-primary" />,
  },
  {
    title: "۳. سود روزانه کسب کنید",
    description: "سهم خود را از استخر سود روزانه دریافت کنید و به سرمایه‌گذاری خود پاداش دهید.",
    icon: <TrendingUp className="w-10 h-10 text-primary" />,
  },
  {
    title: "۴. در قرعه‌کشی برنده شوید",
    description: "به ازای هر ۱۰ دلار سرمایه‌گذاری، به طور خودکار بلیت قرعه‌کشی دریافت کرده و برنده بزرگ شوید.",
    icon: <Ticket className="w-10 h-10 text-primary" />,
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="mb-12 text-center">
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
            در ۴ مرحله ساده سرمایه‌گذاری را شروع کنید
          </h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed">
            پلتفرم ما برای سادگی و شفافیت طراحی شده است. برای شروع این مراحل را دنبال کنید.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
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
      </div>
    </section>
  );
}
