import { Button } from "@/components/ui/button";
import Image from "next/image";

export function HeroSection() {
  return (
    <section className="w-full pt-12 md:pt-24 lg:pt-32">
      <div className="container grid gap-10 px-4 md:px-6 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col justify-center space-y-6">
          <h1 className="font-headline text-4xl font-bold tracking-tighter text-primary sm:text-5xl md:text-6xl lg:text-7xl">
            Welcome to Verdant Vault
          </h1>
          <p className="max-w-[600px] text-muted-foreground md:text-xl">
            A new era of international investment. Start with as little as $1 and watch your assets grow through our transparent, secure, and profitable funds.
          </p>
          <div className="flex flex-col gap-2 min-[400px]:flex-row">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
              <a href="#funds">Explore Funds</a>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <a href="#how-it-works">Learn More</a>
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center">
            <Image
                src="https://placehold.co/600x400.png"
                width={600}
                height={400}
                alt="Financial Growth"
                data-ai-hint="finance abstract"
                className="overflow-hidden rounded-xl object-cover"
            />
        </div>
      </div>
    </section>
  );
}
