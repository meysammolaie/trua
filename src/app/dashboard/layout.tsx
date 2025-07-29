
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Bell,
  CircleUser,
  Home,
  LineChart,
  Menu,
  MessageSquare,
  Package,
  Settings,
  Users,
  Wallet,
  CandlestickChart,
  ClipboardCheck,
  ArrowRightLeft,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { VerdantVaultLogo } from "@/components/icons";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { ChatWidget } from "@/components/chat/chat-widget";
import { MobileDashboardNav } from "@/components/layout/mobile-dashboard-nav";
import { Notifications } from "@/components/dashboard/notifications";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/dashboard/invest", icon: Package, label: "Invest" },
  { href: "/dashboard/wallet", icon: Wallet, label: "Wallet" },
  { href: "/dashboard/reports", icon: ArrowRightLeft, label: "Transactions" },
  { href: "/dashboard/analytics", icon: CandlestickChart, label: "Analytics" },
  { href: "/dashboard/tasks", icon: ClipboardCheck, label: "Tasks" },
  { href: "/dashboard/referrals", icon: Users, label: "Referrals" },
  { href: "/dashboard/support", icon: MessageSquare, label: "Support" },
  { href: "/dashboard/profile", icon: CircleUser, label: "Profile" },
];

const mobileNavItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/dashboard/invest", icon: Package, label: "Invest" },
  { href: "/dashboard/wallet", icon: Wallet, label: "Wallet" },
  { href: "/dashboard/reports", icon: ArrowRightLeft, label: "Transactions" },
  { href: "/dashboard/profile", icon: CircleUser, label: "Profile" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logout Successful",
        description: "You have been successfully logged out.",
      });
      router.push("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout Error",
        description: "There was a problem logging out.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-transparent">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }
  
  const NavLink = ({ item, isSheet = false }: { item: typeof navItems[0], isSheet?: boolean }) => {
    const isActive = (item.href === "/dashboard" && pathname === item.href) || (item.href !== "/dashboard" && pathname.startsWith(item.href));
    return (
        <Link
            href={item.href}
            className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                isActive && "bg-muted text-primary",
                isSheet && "text-lg"
            )}
        >
            <item.icon className="h-5 w-5" />
            {item.label}
        </Link>
    );
  };

  const getPageTitle = () => {
    const activeItem = navItems.find(item => (item.href === "/dashboard" && pathname === item.href) || (item.href !== "/dashboard" && pathname.startsWith(item.href)));
    return activeItem?.label || "Trusva";
  };


  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] bg-transparent">
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-black/10 backdrop-blur-lg md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <VerdantVaultLogo className="h-6 w-6" />
              <span className="">Trusva</span>
            </Link>
            <div className="ml-auto">
              <Notifications />
            </div>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navItems.map(item => <NavLink key={item.href} item={item} />)}
            </nav>
          </div>
        </div>
      </div>
      
      {/* Mobile & Main Content */}
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-black/10 px-4 backdrop-blur-lg lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col bg-card/80 backdrop-blur-lg">
               <SheetHeader className="text-left">
                  <SheetTitle className="flex items-center gap-2">
                      <VerdantVaultLogo className="h-6 w-6" />
                      <span>Trusva Menu</span>
                  </SheetTitle>
                  <SheetDescription>
                      Navigate to different sections of the dashboard.
                  </SheetDescription>
              </SheetHeader>
              <nav className="grid gap-2 text-lg font-medium mt-4">
                {navItems.map(item => <NavLink key={item.href} item={item} isSheet />)}
              </nav>
            </SheetContent>
          </Sheet>
          
          {/* Mobile Page Title */}
          <div className="w-full flex-1 md:hidden">
              <h1 className="font-semibold text-lg">{getPageTitle()}</h1>
          </div>
          
          <div className="w-full flex-1 hidden md:block" />
           <div className="md:hidden">
              <Notifications />
            </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card/80 backdrop-blur-lg">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link href="/dashboard/profile">Profile</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/dashboard/support">Support</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-transparent mb-16 md:mb-0">
            {children}
        </main>
        <ChatWidget />
        <MobileDashboardNav navItems={mobileNavItems} />
      </div>
    </div>
  );
}
