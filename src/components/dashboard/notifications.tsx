
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Check, Circle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { getUserNotificationsAction, markNotificationAsReadAction } from "@/app/actions/notifications";
import type { Notification } from "@/ai/flows/get-user-notifications-flow";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function Notifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await getUserNotificationsAction({ userId: user.uid });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      // silent fail
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user) return;
    try {
        const result = await markNotificationAsReadAction({ userId: user.uid, notificationId });
        if(result.success) {
            await fetchNotifications(); // Refresh list
        } else {
            throw new Error("Failed to mark as read");
        }
    } catch (error) {
        toast({variant: "destructive", title: "خطا", description: "مشکلی در بروزرسانی اعلان رخ داد."});
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-card/80 backdrop-blur-lg">
        <DropdownMenuLabel>اعلان‌ها</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
            <DropdownMenuItem disabled>هیچ اعلان جدیدی وجود ندارد.</DropdownMenuItem>
        ) : (
            notifications.map(notif => (
                 <DropdownMenuItem key={notif.id} className={cn("flex items-start gap-2", !notif.isRead && "font-bold")} onSelect={(e) => e.preventDefault()}>
                    <div className="flex-shrink-0 pt-1">
                       {!notif.isRead ? <Circle className="h-2 w-2 text-primary fill-current" /> : <Circle className="h-2 w-2 text-muted-foreground" />}
                    </div>
                    <div className="flex-grow">
                        <p>{notif.title}</p>
                        <p className={cn("text-xs text-muted-foreground", !notif.isRead && "text-foreground/80")}>{notif.message}</p>
                    </div>
                     {!notif.isRead && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMarkAsRead(notif.id)}>
                            <Check className="h-4 w-4" />
                            <span className="sr-only">Mark as read</span>
                        </Button>
                     )}
                </DropdownMenuItem>
            ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
