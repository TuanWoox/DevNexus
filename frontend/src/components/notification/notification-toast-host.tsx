"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Notification } from "@/features/notifications/types/contracts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function NotificationToastHost() {
    const pathname = usePathname();
    const router = useRouter();
    const isOnNotificationsPage = pathname.startsWith("/notifications");

    useEffect(() => {
        const handler = (e: Event) => {
            if (isOnNotificationsPage) return;
            const notification = (e as CustomEvent<Notification>).detail;
            if (!notification) return;

            toast.custom(
                (t) => {
                    const actorName = notification.Actor?.FullName ?? "User";
                    const fallback = actorName.trim().charAt(0).toUpperCase() || "U";

                    return (
                        <Card className="w-85 border-border/60 bg-card/80 shadow-lg shadow-black/5 ring-1 ring-foreground/5 backdrop-blur supports-backdrop-filter:bg-card/60">
                            <CardContent className="flex items-center gap-3.5 p-3.5">
                                <Avatar size="sm">
                                    <AvatarImage
                                        src={notification.Actor?.AvatarUrl || "/images/default-avatar.webp"}
                                        alt={actorName}
                                    />
                                    <AvatarFallback>{fallback}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 text-sm text-foreground/90 leading-snug line-clamp-2">
                                    {notification.Message}
                                </div>
                                {notification.ActionUrl ? (
                                    <Button
                                        size="xs"
                                        onClick={() => {
                                            router.push(notification.ActionUrl!);
                                            toast.dismiss(t);
                                        }}
                                        type="button"
                                    >
                                        View
                                    </Button>
                                ) : null}
                            </CardContent>
                        </Card>
                    );
                },
                {
                    duration: 5000,
                    position: "bottom-right",
                },
            );
        };

        window.addEventListener("new-notification", handler);
        return () => window.removeEventListener("new-notification", handler);
    }, [isOnNotificationsPage, router]);

    return null;
}
