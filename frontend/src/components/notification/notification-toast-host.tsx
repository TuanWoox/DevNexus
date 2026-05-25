"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Notification } from "@/features/notifications/types/contracts";
import { ActorType, NotificationEventEnum } from "@/features/notifications/types/enums";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ConnectionsModal } from "@/components/profile/connections/connections-modal";
import { CheckCircle2, Clock3, Flag, ShieldCheck } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export function NotificationToastHost() {
    const pathname = usePathname();
    const router = useRouter();
    const user = useSelector((state: RootState) => state.auth.user);
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

            toast.custom(
                (t) => {
                    const actorName = notification.ActorName ??
                        (notification.ActorType === ActorType.SYSTEM ? "DevNexus" : "User");
                    const isModerationResult = notification.Type === NotificationEventEnum.MODERATION_RESULT;
                    const moderationActionUrl = notification.ActionUrl ??
                        (notification.EntityId ? `/post/${notification.EntityId}` : undefined);
                    const actionableNotification = isModerationResult
                        ? { ...notification, ActionUrl: moderationActionUrl }
                        : notification;

                    const moderationIcon =
                        notification.EntityPreview === "Approved"
                            ? {
                                Icon: CheckCircle2,
                                label: notification.Message || "Post approved",
                                className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                            }
                            : notification.EntityPreview === "Flagged"
                                ? {
                                    Icon: Flag,
                                    label: notification.Message || "Post flagged",
                                    className: "bg-destructive/10 text-destructive",
                                }
                                : {
                                    Icon: Clock3,
                                    label: notification.Message || "Post sent to review",
                                    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                                };
                    const ModerationIcon = moderationIcon.Icon;

                    return (
                        <Card className="w-85 border-border/60 bg-card/80 shadow-lg shadow-black/5 ring-1 ring-foreground/5 backdrop-blur supports-backdrop-filter:bg-card/60">
                            <CardContent className="flex items-center gap-3.5 p-3.5">
                                {isModerationResult ? (
                                    <span className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${moderationIcon.className}`}>
                                        <ModerationIcon className="h-4 w-4" />
                                    </span>
                                ) : notification.ActorType === ActorType.SYSTEM ? (
                                    <span className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                                        <ShieldCheck className="h-4 w-4 text-primary" />
                                    </span>
                                ) : (
                                    <UserAvatar avatarUrl={notification.ActorAvatarUrl} fullName={actorName} size="sm" />
                                )}
                                <div className="flex-1 text-sm text-foreground/90 leading-snug line-clamp-2">
                                    {isModerationResult ? moderationIcon.label : notification.Message}
                                </div>
                                {(notification.Type === NotificationEventEnum.FOLLOW_REQUEST || actionableNotification.ActionUrl) && (
                                    <Button
                                        size="xs"
                                        onClick={() => handleViewClick(actionableNotification, t)}
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
                <ConnectionsModal
                    open={true}
                    onClose={() => setActiveOverlay(null)}
                    profileId={user?.profileId ?? ""}
                    isOwnProfile
                    initialTab="requests"
                />
            )}
        </>
    );
}
