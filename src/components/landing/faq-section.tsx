
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How is my profit calculated and distributed?",
    answer:
      "Profit is generated from the entry and exit fees of all users. This profit pool is distributed daily among all active investors. Your share is calculated based on your investment amount, its duration, and a special incentive multiplier that rewards long-term investors. The longer you keep your funds in the platform, the higher your potential return.",
  },
  {
    question: "What are the fees for using Trusva?",
    answer:
      "We believe in full transparency. The fees are as follows: a 3% entry fee, a 2% lottery fee, and a 1% platform fee. When withdrawing the principal, a 2% exit fee is applied. The most important thing is that all these fees go back to the profit pool for other investors and are not pocketed by the platform.",
  },
  {
    question: "Is my investment secure?",
    answer:
      "Security is our top priority. We use state-of-the-art security measures, including two-factor authentication (2FA) for login, full data encryption, and regular security audits. Our platform is built on a robust infrastructure to protect your investments and personal information.",
  },
  {
    question: "Can I invest in multiple funds at the same time?",
    answer:
      "Absolutely. You can diversify your portfolio by investing in any or all of the four funds: Gold, Silver, Dollar, and Bitcoin. All your investments are manageable through a single, integrated dashboard.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="w-full py-12 md:py-24 lg:py-32 bg-transparent">
      <div className="container px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-muted-foreground md:text-xl/relaxed">
            Answers to some of your most common questions. If you have another question, our support team is always ready to help.
          </p>
        </div>
        <div className="mx-auto max-w-3xl mt-12">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-white/10">
                <AccordionTrigger className="text-left font-bold text-lg hover:no-underline text-foreground">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground text-left">
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
