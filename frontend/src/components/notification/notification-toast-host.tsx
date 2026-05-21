"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Notification } from "@/features/notifications/types/contracts";
import { ActorType, NotificationEventEnum } from "@/features/notifications/types/enums";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { FollowRequestOverlay } from "./follow-request-overlay";
import { ShieldCheck } from "lucide-react";

export function NotificationToastHost() {
    const pathname = usePathname();
    const router = useRouter();
    const isOnNotificationsPage = pathname.startsWith("/notifications");
    const [activeOverlay, setActiveOverlay] = useState<NotificationEventEnum | null>(null);

    const handleViewClick = useCallback((notification: Notification, toastId: string | number) => {
        toast.dismiss(toastId);

        if (notification.Type === NotificationEventEnum.FOLLOW_REQUEST) {
            setActiveOverlay(NotificationEventEnum.FOLLOW_REQUEST);
        } else if (notification.ActionUrl) {
            router.push(notification.ActionUrl);
        }
    }, [router]);

    useEffect(() => {
        const handler = (e: Event) => {
            if (isOnNotificationsPage) return;
            const notification = (e as CustomEvent<Notification>).detail;
            if (!notification) return;

            if (notification.Type === NotificationEventEnum.MODERATION_RESULT) {
                const preview = notification.EntityPreview;
                const postUrl = notification.ActionUrl ?? (notification.EntityId ? `/post/${notification.EntityId}` : undefined);
                const options = {
                    action: postUrl
                        ? { label: "View", onClick: () => router.push(postUrl) }
                        : undefined,
                };

                if (preview === "Approved") {
                    toast.success(notification.Message || "Post approved", options);
                } else if (preview === "Flagged") {
                    toast.warning(notification.Message || "Post flagged", options);
                } else {
                    toast(notification.Message || "Post sent to review", options);
                }

                return;
            }

            // --- Generic notification toast for all other event types ---
            toast.custom(
                (t) => {
                    const actorName = notification.ActorName ??
                        (notification.ActorType === ActorType.SYSTEM ? "DevNexus" : "User");

                    return (
                        <Card className="w-85 border-border/60 bg-card/80 shadow-lg shadow-black/5 ring-1 ring-foreground/5 backdrop-blur supports-backdrop-filter:bg-card/60">
                            <CardContent className="flex items-center gap-3.5 p-3.5">
                                {notification.ActorType === ActorType.SYSTEM ? (
                                    <span className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                                        <ShieldCheck className="h-4 w-4 text-primary" />
                                    </span>
                                ) : (
                                    <UserAvatar avatarUrl={notification.ActorAvatarUrl} fullName={actorName} size="sm" />
                                )}
                                <div className="flex-1 text-sm text-foreground/90 leading-snug line-clamp-2">
                                    {notification.Message}
                                </div>
                                {(notification.Type === NotificationEventEnum.FOLLOW_REQUEST || notification.ActionUrl) && (
                                    <Button
                                        size="xs"
                                        onClick={() => handleViewClick(notification, t)}
                                        type="button"
                                    >
                                        View
                                    </Button>
                                )}
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
    }, [isOnNotificationsPage, handleViewClick, router]);

    return (
        <>
            {activeOverlay === NotificationEventEnum.FOLLOW_REQUEST && (
                <FollowRequestOverlay
                    open={true}
                    onClose={() => setActiveOverlay(null)}
                />
            )}
        </>
    );
}
