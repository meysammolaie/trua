import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bitcoin, Crown, Landmark, Medal } from "lucide-react";
import { motion } from "framer-motion";

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function FundsSection() {
  return (
    <section id="funds" className="w-full py-12 md:py-24 lg:py-32 bg-transparent">
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
        <motion.div 
            className="mx-auto grid max-w-5xl items-start gap-6 py-12 sm:grid-cols-2 md:gap-12 lg:grid-cols-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
        >
          {funds.map((fund) => (
            <motion.div key={fund.name} variants={cardVariants}>
                 <Card className="h-full transition-all duration-300 hover:shadow-primary/20 hover:-translate-y-2 hover:shadow-2xl bg-card/40">
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
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
