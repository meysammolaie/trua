import Link from "next/link";
import { VerdantVaultLogo } from "@/components/icons";
import { Button } from "../ui/button";
import { Github, Twitter, Linkedin } from "lucide-react";

const socialLinks = [
  { name: "Twitter", icon: Twitter, href: "#" },
  { name: "LinkedIn", icon: Linkedin, href: "#" },
  { name: "GitHub", icon: Github, href: "#" },
];

export function Footer() {
  return (
    <footer className="bg-transparent text-card-foreground border-t border-white/10 mt-12">
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Link href="#" className="flex items-center gap-2" prefetch={false}>
              <VerdantVaultLogo className="h-8 w-8" />
              <span className="font-headline text-xl font-semibold">
                Trusva
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              سرمایه‌گذاری‌های امن و شفاف برای آینده‌ای سبزتر.
            </p>
          </div>
          <div className="grid gap-4 text-sm md:grid-cols-2">
            <div className="grid gap-1">
              <h3 className="font-semibold font-headline">لینک‌های سریع</h3>
              <Link href="#funds" prefetch={false} className="text-muted-foreground hover:text-foreground">صندوق‌ها</Link>
              <Link href="#how-it-works" prefetch={false} className="text-muted-foreground hover:text-foreground">چگونه کار می‌کند</Link>
              <Link href="#lottery" prefetch={false} className="text-muted-foreground hover:text-foreground">قرعه‌کشی</Link>
              <Link href="#faq" prefetch={false} className="text-muted-foreground hover:text-foreground">سوالات متداول</Link>
            </div>
            <div className="grid gap-1">
              <h3 className="font-semibold font-headline">حقوقی</h3>
              <Link href="#" prefetch={false} className="text-muted-foreground hover:text-foreground">شرایط خدمات</Link>
              <Link href="#" prefetch={false} className="text-muted-foreground hover:text-foreground">سیاست حفظ حریم خصوصی</Link>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold font-headline">ما را دنبال کنید</h3>
            <div className="flex gap-2">
              {socialLinks.map((link) => (
                <Button key={link.name} variant="ghost" size="icon" asChild>
                  <a href={link.href} aria-label={link.name}>
                    <link.icon className="h-5 w-5" />
                  </a>
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-white/10 pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Trusva. تمام حقوق محفوظ است.
        </div>
      </div>
    </footer>
  );
}
