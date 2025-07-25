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

const navLinks = [
  { name: "Home", href: "#", icon: Home },
  { name: "Funds", href: "#funds", icon: Landmark },
  { name: "Lottery", href: "#lottery", icon: Ticket },
  { name: "FAQ", href: "#faq", icon: MessageSquareQuote },
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
    <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="grid h-full grid-cols-5 mx-auto">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="inline-flex flex-col items-center justify-center px-1 text-center font-medium hover:bg-accent/50 text-muted-foreground hover:text-foreground group"
            prefetch={false}
          >
            <link.icon className="w-5 h-5 mb-1" />
            <span className="text-xs">{link.name}</span>
          </Link>
        ))}
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="inline-flex flex-col items-center justify-center px-1 text-center font-medium hover:bg-accent/50 text-muted-foreground hover:text-foreground group"
            >
              <User className="w-5 h-5 mb-1" />
              <span className="text-xs">Account</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto rounded-t-lg">
            <SheetHeader className="text-center mb-4">
              <SheetTitle className="font-headline text-2xl">Join Verdant Vault</SheetTitle>
              <SheetDescription>
                Access your portfolio or create a new account to start investing.
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-3 px-4">
              <Button size="lg">Sign Up</Button>
              <Button size="lg" variant="outline">
                Log In
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
