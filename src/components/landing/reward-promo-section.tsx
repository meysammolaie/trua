
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getAllUsersAction } from "@/app/actions/users";

export function RewardPromoSection() {
    const [userCount, setUserCount] = useState<number | null>(null);

    useEffect(() => {
        getAllUsersAction().then(data => setUserCount(data.users.length)).catch(console.error);
    }, []);

    const filledPercentage = userCount !== null ? Math.min((userCount / 5000) * 100, 100) : 0;

  return (
    <section id="reward-promo" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <Card className="bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border-primary/30 overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="font-headline text-3xl font-bold tracking-tighter text-foreground sm:text-4xl md:text-5xl">
                   به ۵,۰۰۰ نفر اول ۱۰۰$ جایزه می‌دهیم!
                </h2>
                <p className="mt-4 max-w-xl text-muted-foreground md:text-lg">
                  با اولین سرمایه‌گذاری خود (حتی ۱ دلار)، جزو ۵,۰۰۰ کاربر اول باشید و <span className="text-yellow-400 font-bold">۱۰۰ دلار جایزه قفل‌شده</span> دریافت کنید. این جایزه با رسیدن حجم کل سرمایه پلتفرم به هدف تعیین شده، برای شما آزاد خواهد شد.
                </p>
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-2 text-sm text-muted-foreground">
                        <span>ظرفیت باقی‌مانده</span>
                        <span>{userCount !== null ? `${(5000 - userCount).toLocaleString()} نفر` : '...'}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                        <motion.div 
                            className="bg-primary h-2.5 rounded-full" 
                            style={{ width: `${filledPercentage}%` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${filledPercentage}%`}}
                            transition={{ duration: 1, ease: "easeInOut" }}
                        />
                    </div>
                </div>
                 <Button asChild size="lg" className="mt-8">
                    <Link href="/signup">همین حالا جایزه را بگیر</Link>
                </Button>
              </motion.div>
            </div>
             <div className="hidden md:flex items-center justify-center p-12 bg-primary/10 relative overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                     viewport={{ once: true }}
                >
                    <Gift className="w-48 h-48 text-primary opacity-80" />
                </motion.div>
                <motion.div 
                    className="absolute text-white/5"
                    style={{ top: '10%', left: '20%' }}
                    animate={{ y: [0, -10, 0], x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                >
                     <Users className="w-24 h-24" />
                </motion.div>
                 <motion.div 
                    className="absolute text-white/5"
                    style={{ bottom: '15%', right: '15%' }}
                    animate={{ y: [0, 10, 0], x: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                >
                     <TrendingUp className="w-20 h-20" />
                </motion.div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
