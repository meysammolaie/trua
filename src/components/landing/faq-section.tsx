import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "سود من چگونه محاسبه و توزیع می‌شود؟",
    answer:
      "سود از محل کارمزدهای ورودی و خروجی تمام کاربران تولید می‌شود. این استخر سود به صورت روزانه بین تمام سرمایه‌گذاران فعال توزیع می‌شود. سهم شما بر اساس مقدار سرمایه‌گذاری، مدت زمان و یک ضریب تشویقی ویژه که به سرمایه‌گذاران بلندمدت پاداش می‌دهد، محاسبه می‌شود. هر چه مدت بیشتری وجوه خود را در پلتفرم نگه دارید، بازده بالقوه شما بیشتر خواهد بود.",
  },
  {
    question: "کارمزدهای استفاده از Trusva چقدر است؟",
    answer:
      "ما به شفافیت کامل اعتقاد داریم. کارمزدها به شرح زیر است: ۳٪ کارمزد ورود، ۲٪ کارمزد قرعه‌کشی و ۱٪ کارمزد پلتفرم. در زمان برداشت اصل سرمایه نیز ۲٪ کارمزد خروج اعمال می‌شود که مهمترین نکته این است که تمام این کارمزدها به استخر سود برای سایر سرمایه‌گذاران بازمی‌گردد و به جیب پلتفرم نمی‌رود.",
  },
  {
    question: "آیا سرمایه‌گذاری من امن است؟",
    answer:
      "امنیت اولویت اصلی ماست. ما از به‌روزترین اقدامات امنیتی، از جمله احراز هویت دو مرحله‌ای (2FA) برای ورود، رمزگذاری کامل داده‌ها و ممیزی‌های امنیتی منظم استفاده می‌کنیم. پلتفرم ما بر روی یک زیرساخت قوی برای محافظت از سرمایه‌گذاری‌ها و اطلاعات شخصی شما ساخته شده است.",
  },
  {
    question: "آیا می‌توانم همزمان در چندین صندوق سرمایه‌گذاری کنم؟",
    answer:
      "قطعاً. شما می‌توانید با سرمایه‌گذاری در هر یک یا تمام چهار صندوق طلا، نقره، دلار و بیت‌کوین، سبد خود را متنوع کنید. تمام سرمایه‌گذاری‌های شما از طریق یک داشبورد یکپارچه قابل مدیریت است.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="w-full py-12 md:py-24 lg:py-32 bg-transparent">
      <div className="container px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            سوالات متداول
          </h2>
          <p className="mt-4 text-muted-foreground md:text-xl/relaxed">
            پاسخ به برخی از رایج‌ترین سوالات شما. اگر سوال دیگری دارید، تیم پشتیبانی ما همیشه آماده کمک است.
          </p>
        </div>
        <div className="mx-auto max-w-3xl mt-12">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-white/10">
                <AccordionTrigger className="text-right font-bold text-lg hover:no-underline text-foreground">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground text-right">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
