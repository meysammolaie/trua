
"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <motion.section 
        className="w-full pt-12 md:pt-24 lg:pt-32"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
      <div className="container grid gap-10 px-4 md:px-6 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col justify-center space-y-6">
          <motion.h1 
            className="font-headline text-4xl font-bold tracking-tighter text-primary sm:text-5xl md:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            به خزانه سرسبز خوش آمدید
          </motion.h1>
          <motion.p 
            className="max-w-[600px] text-muted-foreground md:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            عصری جدید در سرمایه‌گذاری بین‌المللی. با تنها ۱ دلار شروع کنید و شاهد رشد دارایی‌های خود از طریق صندوق‌های شفاف، امن و سودآور ما باشید.
          </motion.p>
          <motion.div 
            className="flex flex-col gap-2 min-[400px]:flex-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
              <a href="#funds">کاوش در صندوق‌ها</a>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <a href="#how-it-works">بیشتر بدانید</a>
            </Button>
          </motion.div>
        </div>
        <motion.div 
            className="flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
        >
            <Image
                src="https://placehold.co/600x400.png"
                width={600}
                height={400}
                alt="رشد مالی"
                data-ai-hint="finance growth"
                className="overflow-hidden rounded-xl object-cover"
            />
        </motion.div>
      </div>
    </motion.section>
  );
}
