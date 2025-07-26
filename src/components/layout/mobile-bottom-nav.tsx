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

  return null; // The user requested to remove this from the home page.
}
