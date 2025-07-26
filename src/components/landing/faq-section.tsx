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
      "سود از محل کارمزدهای ورودی و خروجی تولید می‌شود. این استخر روزانه بین تمام سرمایه‌گذاران فعال توزیع می‌شود. سهم شما بر اساس مقدار سرمایه‌گذاری، مدت زمان سرمایه‌گذاری و یک ضریب تشویقی ویژه که به سرمایه‌گذاران بلندمدت پاداش می‌دهد، محاسبه می‌شود. هر چه مدت بیشتری وجوه خود را در پلتفرم نگه دارید، بازده بالقوه شما بیشتر خواهد بود.",
  },
  {
    question: "کارمزدهای استفاده از خزانه سرسبز چقدر است؟",
    answer:
      "ما به شفافیت اعتقاد داریم. سه نوع کارمزد وجود دارد: ۳٪ کارمزد ورودی هنگام سرمایه‌گذاری، ۲٪ کارمزد قرعه‌کشی که صندوق جایزه ماهانه را تأمین می‌کند و ۱٪ کارمزد پلتفرم برای نگهداری و عملیات. اگر تصمیم به برداشت اصل سرمایه‌گذاری خود بگیرید، ۲٪ کارمزد خروج اعمال می‌شود که به استخر سود برای سایر سرمایه‌گذاران بازمی‌گردد.",
  },
  {
    question: "چگونه برای قرعه‌کشی ماهانه واجد شرایط شوم؟",
    answer:
      "به ازای هر ۱۰ دلار (یا معادل آن در سایر صندوق‌ها) که سرمایه‌گذاری می‌کنید، به طور خودکار یک بلیت برای قرعه‌کشی ماهانه دریافت می‌کنید. هر چه بیشتر سرمایه‌گذاری کنید، بلیت‌های بیشتری دریافت می‌کنید و شانس برنده شدن شما افزایش می‌یابد. قرعه‌کشی به طور خودکار در پایان هر ماه برگزار می‌شود.",
  },
  {
    question: "آیا سرمایه‌گذاری من امن است؟",
    answer:
      "امنیت اولویت اصلی ماست. ما از به‌روزترین اقدامات امنیتی، از جمله احراز هویت دو مرحله‌ای برای ورود، ذخیره‌سازی داده‌های رمزگذاری شده و ممیزی‌های امنیتی منظم استفاده می‌کنیم. پلتفرم ما بر روی یک زیرساخت قوی برای محافظت از سرمایه‌گذاری‌ها و اطلاعات شخصی شما ساخته شده است.",
  },
  {
    question: "آیا می‌توانم همزمان در چندین صندوق سرمایه‌گذاری کنم؟",
    answer:
      "قطعاً. شما می‌توانید با سرمایه‌گذاری در هر یک یا تمام چهار صندوق طلا، نقره، دلار و بیت‌کوین، سبد خود را متنوع کنید. شما می‌توانید تمام سرمایه‌گذاری‌های خود را از داشبورد شخصی خود مدیریت کنید.",
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
            سوالی دارید؟ ما پاسخگو هستیم. در اینجا برخی از متداول‌ترین سوالاتی که از ما پرسیده می‌شود آمده است.
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
