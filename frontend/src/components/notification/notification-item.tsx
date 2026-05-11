"use client";

import { useState } from "react";
import { Trash2, BellOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Notification } from "@/features/notifications/types/contracts";
import { NotificationEventEnum } from "@/features/notifications/types/enums";
import { useMarkAsRead } from "@/features/notifications/hooks/notifications/use-mark-as-read";
import { useDeleteNotification } from "@/features/notifications/hooks/notifications/use-delete-notification";
import { useAddMute } from "@/features/notifications/hooks/settings/use-mute-settings";
import { FollowRequestOverlay } from "./follow-request-overlay";
import { toRelativeTime } from "@/features/messages/utils/message-service.helper";
import { cn } from "@/lib/utils";

interface Props {
    notification: Notification;
    onClose: () => void;
}

export function NotificationItem({ notification, onClose }: Props) {
    const router = useRouter();
    const markAsRead = useMarkAsRead();
    const deleteNotif = useDeleteNotification();
    const addMute = useAddMute();
    const [activeOverlay, setActiveOverlay] = useState<NotificationEventEnum | null>(null);

    const handleClick = () => {
        if (!notification.IsRead) markAsRead.mutate(notification.Id);

        // Special handling for FOLLOW_REQUEST - show overlay instead of navigate
        if (notification.Type === NotificationEventEnum.FOLLOW_REQUEST) {
            setActiveOverlay(NotificationEventEnum.FOLLOW_REQUEST);
            return;
        }

        // Regular notifications - navigate
        if (notification.ActionUrl) {
            router.push(notification.ActionUrl);
            onClose();
        }
    };

    const handleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (notification.EntityType !== undefined && notification.EntityId !== undefined) {
            addMute.mutate({
                EntityType: notification.EntityType,
                EntityId: notification.EntityId,
                Type: notification.Type,
            });
        }
    };

    return (
        <div
            onClick={handleClick}
            className={cn(
                "relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors group",
                "hover:bg-subtle",
                !notification.IsRead && "bg-primary/5",
            )}
        >
            {/* Unread indicator */}
            {!notification.IsRead && (
                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            )}

            <Avatar className="h-10 w-10 shrink-0 border border-default">
                <AvatarImage
                    src={notification.Actor?.AvatarUrl || "/images/default-avatar.webp"}
                    alt={notification.Actor?.FullName ?? "User"}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {notification.Actor?.FullName?.charAt(0)?.toUpperCase() ?? "U"}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 pr-7">
                <p className="text-sm text-body leading-relaxed">
                    {notification.Message}
                </p>
                {notification.EntityPreview && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {notification.EntityPreview}
                    </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                    <span
                        className={cn(
                            "text-xs",
                            !notification.IsRead ? "text-primary font-medium" : "text-muted-foreground",
                        )}
                    >
                        {toRelativeTime(notification.DateCreated)}
                    </span>
                    {!notification.IsRead && (
                        <span className="text-xs font-semibold text-primary">• New</span>
                    )}
                </div>
            </div>

            {notification.EntityType !== undefined && notification.EntityId !== undefined && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleMute}
                    disabled={addMute.isPending}
                    className="absolute top-2 right-10 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-muted"
                    aria-label="Mute notification"
                >
                    <BellOff className="h-3.5 w-3.5" />
                </Button>
            )}
            <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                    e.stopPropagation();
                    deleteNotif.mutate(notification.Id);
                }}
                disabled={deleteNotif.isPending}
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-destructive/10 hover:text-destructive"
                aria-label="Delete notification"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </Button>

            {activeOverlay === NotificationEventEnum.FOLLOW_REQUEST && (
                <FollowRequestOverlay
                    open={true}
                    onClose={() => setActiveOverlay(null)}
                />
            )}
        </div>
    );
}
