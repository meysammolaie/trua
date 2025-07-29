
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VerdantVaultLogo } from "@/components/icons";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../ui/sheet";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "Funds", href: "/#funds" },
  { name: "How it Works", href: "/#how-it-works" },
  { name: "Lottery", href: "/#lottery" },
  { name: "FAQ", href: "/#faq" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/50 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2" prefetch={false}>
          <VerdantVaultLogo className="h-8 w-8" />
          <span className="font-headline text-lg font-bold">Trusva</span>
        </Link>
        
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="transition-colors text-foreground/80 hover:text-foreground"
              prefetch={false}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 md:flex">
                <Button variant="ghost" asChild>
                    <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                    <Link href="/signup">Sign Up</Link>
                </Button>
            </div>
             <Sheet>
                <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                </Button>
                </SheetTrigger>
                <SheetContent side="right" className="flex flex-col bg-card/80 backdrop-blur-lg">
                    <SheetHeader className="text-left">
                        <SheetTitle className="flex items-center gap-2">
                           <VerdantVaultLogo className="h-6 w-6" />
                           <span>Trusva Menu</span>
                        </SheetTitle>
                        <SheetDescription>
                            Navigate to different sections of the site or log in to your account.
                        </SheetDescription>
                    </SheetHeader>
                    <nav className="grid gap-4 text-lg font-medium mt-4">
                        {navLinks.map((item) => (
                             <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary text-lg"
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                     <div className="mt-auto flex flex-col gap-2">
                        <Button variant="ghost" asChild size="lg">
                            <Link href="/login">Login</Link>
                        </Button>
                        <Button asChild size="lg">
                            <Link href="/signup">Sign Up</Link>
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>

      </div>
    </header>
  );
}
