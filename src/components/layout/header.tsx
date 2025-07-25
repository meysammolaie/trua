"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VerdantVaultLogo } from "@/components/icons";

const navLinks = [
  { name: "صندوق‌ها", href: "/#funds" },
  { name: "چگونه کار می‌کند", href: "/#how-it-works" },
  { name: "قرعه‌کشی", href: "/#lottery" },
  { name: "سوالات متداول", href: "/#faq" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2" prefetch={false}>
          <VerdantVaultLogo className="h-8 w-8" />
          <span className="font-headline text-lg font-bold">خزانه سرسبز</span>
        </Link>
        
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              prefetch={false}
            >
              {link.name}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-4 md:flex">
          <Button variant="ghost" asChild>
            <Link href="/login">ورود</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">ثبت نام</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
