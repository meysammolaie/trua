import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { FundsSection } from "@/components/landing/funds-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { LotterySection } from "@/components/landing/lottery-section";
import { FaqSection } from "@/components/landing/faq-section";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { FutureVisionSection } from "@/components/landing/future-vision-section";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FundsSection />
        <HowItWorksSection />
        <LotterySection />
        <FutureVisionSection />
        <FaqSection />
      </main>
      <Footer />
      {/* This nav is only for the landing page on mobile */}
      <MobileBottomNav />
    </div>
  );
}
