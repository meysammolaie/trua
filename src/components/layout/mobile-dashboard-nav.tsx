"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Icon } from "lucide-react";

interface NavItem {
    href: string;
    icon: Icon;
    label: string;
}

interface MobileDashboardNavProps {
    navItems: NavItem[];
}

export function MobileDashboardNav({ navItems }: MobileDashboardNavProps) {
  const pathname = usePathname();

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 border-t border-white/10 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60"
    >
      <div className="grid h-full grid-cols-5 mx-auto">
        {navItems.map((item) => {
          const isActive = (item.href === "/dashboard" && pathname === item.href) || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
             <Link
                key={item.href}
                href={item.href}
                className={cn(
                    "inline-flex flex-col items-center justify-center px-1 text-center font-medium group",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
                )}
                prefetch={false}
            >
                <item.icon className="w-5 h-5 mb-1 transition-transform group-hover:scale-110" />
                <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </motion.div>
  );
}
