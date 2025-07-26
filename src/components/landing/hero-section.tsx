
"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";

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
            این بار، اجازه دهید هوش مصنوعی برای شما درآمد کسب کند
          </motion.h1>
          <motion.p 
            className="max-w-[600px] text-muted-foreground md:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            به اولین پلتفرم درآمدزای مبتنی بر هوش مصنوعی خوش آمدید. ما با شفافیت کامل، امنیت بی‌نظیر و سودآوری پایدار، تعریف جدیدی از سرمایه‌گذاری ارائه می‌دهیم.
          </motion.p>
          <motion.div 
            className="flex flex-col gap-2 min-[400px]:flex-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
              <Link href="/signup">همین حالا شروع کنید</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="#how-it-works">شفافیت در عمل</Link>
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
                alt="رشد مالی با هوش مصنوعی"
                data-ai-hint="digital finance growth"
                className="overflow-hidden rounded-xl object-cover"
            />
        </motion.div>
      </div>
    </motion.section>
  );
}
