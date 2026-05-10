"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Notification } from "@/features/notifications/types/contracts";

export function NotificationToastHost() {
    const pathname = usePathname();
    const router = useRouter();
    const isOnNotificationsPage = pathname.startsWith("/notifications");

    useEffect(() => {
        const handler = (e: Event) => {
            if (isOnNotificationsPage) return;
            const notification = (e as CustomEvent<Notification>).detail;
            if (!notification) return;

            toast(notification.Message, {
                description: notification.EntityPreview,
                icon: notification.ActorAvatarUrl ? (
                    <img
                        src={notification.ActorAvatarUrl}
                        alt={notification.ActorName ?? "User"}
                        className="w-8 h-8 rounded-full"
                    />
                ) : undefined,
                action: notification.ActionUrl
                    ? {
                          label: "View",
                          onClick: () => router.push(notification.ActionUrl!),
                      }
                    : undefined,
                duration: 5000,
            });
        };

        window.addEventListener("new-notification", handler);
        return () => window.removeEventListener("new-notification", handler);
    }, [isOnNotificationsPage, router]);

    return null;
}
