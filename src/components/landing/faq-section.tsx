import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How are my profits calculated and distributed?",
    answer:
      "Profits are generated from the pool of entry and exit fees. This pool is distributed daily among all active investors. Your share is calculated based on the amount of your investment, the duration it has been invested, and a special incentive multiplier that rewards long-term investors. The longer you keep your funds in the platform, the higher your potential returns.",
  },
  {
    question: "What are the fees for using Verdant Vault?",
    answer:
      "We believe in transparency. There are three types of fees: a 3% entry fee when you invest, a 2% lottery fee that funds the monthly prize pool, and a 1% platform fee for maintenance and operations. If you decide to withdraw your principal investment, a 2% exit fee is applied, which goes back into the profit pool for other investors.",
  },
  {
    question: "How do I qualify for the monthly lottery?",
    answer:
      "For every $10 (or its equivalent in other funds) you invest, you automatically receive one ticket for the monthly lottery. The more you invest, the more tickets you get, increasing your chances of winning. The draw is held automatically at the end of each month.",
  },
  {
    question: "Is my investment secure?",
    answer:
      "Security is our top priority. We use state-of-the-art security measures, including two-factor authentication for logins, encrypted data storage, and regular security audits. Our platform is built on a robust infrastructure to protect your investments and personal data.",
  },
  {
    question: "Can I invest in multiple funds at the same time?",
    answer:
      "Absolutely. You can diversify your portfolio by investing in any or all of the four funds: Gold, Silver, USD, and Bitcoin. You can manage all your investments from your personal dashboard.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="w-full py-12 md:py-24 lg:py-32 bg-card">
      <div className="container px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-muted-foreground md:text-xl/relaxed">
            Have questions? We have answers. Here are some of the most common
            questions we get.
          </p>
        </div>
        <div className="mx-auto max-w-3xl mt-12">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-bold text-lg hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">
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
