"use client";

import * as React from "react";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Home, Landmark, Ticket, User, MessageSquareQuote } from "lucide-react";
import { motion } from "framer-motion";


const navLinks = [
  { name: "خانه", href: "/", icon: Home },
  { name: "صندوق‌ها", href: "/#funds", icon: Landmark },
  { name: "قرعه‌کشی", href: "/#lottery", icon: Ticket },
  { name: "سوالات", href: "/#faq", icon: MessageSquareQuote },
];

export function MobileBottomNav() {
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const isMobile = useIsMobile();

  if (!isClient || !isMobile) {
    return null;
  }

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 border-t bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60"
    >
      <div className="grid h-full grid-cols-5 mx-auto">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="inline-flex flex-col items-center justify-center px-1 text-center font-medium text-muted-foreground hover:text-primary group"
            prefetch={false}
          >
            <link.icon className="w-5 h-5 mb-1 transition-transform group-hover:scale-110" />
            <span className="text-xs">{link.name}</span>
          </Link>
        ))}
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="inline-flex flex-col items-center justify-center px-1 text-center font-medium text-muted-foreground hover:text-primary group"
            >
              <User className="w-5 h-5 mb-1 transition-transform group-hover:scale-110" />
              <span className="text-xs">حساب</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto rounded-t-lg bg-background/90 backdrop-blur-lg">
            <SheetHeader className="text-center mb-4">
              <SheetTitle className="font-headline text-2xl">به خزانه سرسبز بپیوندید</SheetTitle>
              <SheetDescription>
                به سبد خود دسترسی پیدا کنید یا برای شروع سرمایه‌گذاری یک حساب جدید ایجاد کنید.
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-3 px-4">
               <Button size="lg" asChild><Link href="/signup">ثبت نام</Link></Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">ورود</Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </motion.div>
  );
}
