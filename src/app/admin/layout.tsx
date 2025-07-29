
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
  Package,
  Settings,
  Users,
  Wallet,
  Shield,
  DollarSign,
  Ticket,
  ArrowDownUp,
  Gift,
  ClipboardCheck,
  MessageSquare,
  Annoyed,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { MobileDashboardNav } from "@/components/layout/mobile-dashboard-nav";


const navItems = [
  { href: "/admin/dashboard", icon: Home, label: "Dashboard" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/investments", icon: Package, label: "Investments" },
  { href: "/admin/withdrawals", icon: ArrowDownUp, label: "Withdrawals" },
  { href: "/admin/transactions", icon: Wallet, label: "Transactions" },
  { href: "/admin/support", icon: MessageSquare, label: "Support" },
  { href: "/admin/notifications", icon: Bell, label: "Notifications" },
  { href: "/admin/tasks", icon: ClipboardCheck, label: "Task Management", sidebarOnly: true },
  { href: "/admin/commissions", icon: Gift, label: "Commissions", sidebarOnly: true },
  { href: "/admin/reports", icon: LineChart, label: "Reports", sidebarOnly: true },
  { href: "/admin/lottery", icon: Ticket, label: "Lottery", sidebarOnly: true },
  { href: "/admin/settings", icon: Settings, label: "Settings", sidebarOnly: true },
];


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth(); // TODO: Add admin role check
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
    const isActive = (item.href === "/admin" && pathname === item.href) || (item.href !== "/admin" && pathname.startsWith(item.href));
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
    const activeItem = navItems.find(item => (item.href === "/admin" && pathname === item.href) || (item.href !== "/admin" && pathname.startsWith(item.href)));
    return activeItem?.label || "Admin Panel";
  };


  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] bg-transparent">
      <div className="hidden border-r bg-black/10 backdrop-blur-lg md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
              <Shield className="h-6 w-6 text-primary" />
              <span className="">Admin Panel</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navItems.map(item => <NavLink key={item.href} item={item} />)}
            </nav>
          </div>
        </div>
      </div>
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
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  <Shield className="h-6 w-6 text-primary" />
                  <span >Admin Panel</span>
                </Link>
                {navItems.map(item => <NavLink key={item.href} item={item} isSheet />)}
              </nav>
            </SheetContent>
          </Sheet>
           <div className="w-full flex-1 md:hidden">
              <h1 className="font-semibold text-lg">{getPageTitle()}</h1>
          </div>
          <div className="w-full flex-1 hidden md:block" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card/80 backdrop-blur-lg">
              <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-transparent mb-16 md:mb-0">
            {children}
        </main>
        <MobileDashboardNav navItems={navItems.filter(i => !i.sidebarOnly)} />
      </div>
    </div>
  );
}
