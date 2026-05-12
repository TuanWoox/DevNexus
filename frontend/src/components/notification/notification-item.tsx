"use client";

import { useState } from "react";
import { Trash2, BellOff, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Notification } from "@/features/notifications/types/contracts";
import { NotificationEventEnum } from "@/features/notifications/types/enums";
import { useMarkAsRead } from "@/features/notifications/hooks/notifications/use-mark-as-read";
import { useDeleteNotification } from "@/features/notifications/hooks/notifications/use-delete-notification";
import { useAddMute, useRemoveMute } from "@/features/notifications/hooks/settings/use-mute-settings";
import { FollowRequestOverlay } from "./follow-request-overlay";
import { toRelativeTime } from "@/features/messages/utils/message-service.helper";
import { getEntityTypeName, getNotificationTypeName } from "@/features/notifications/utils/notification-helpers";
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
    const removeMute = useRemoveMute();
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

    const handleUnmute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (notification.EntityType !== undefined && notification.EntityId !== undefined) {
            removeMute.mutate({
                EntityType: notification.EntityType,
                EntityId: notification.EntityId,
                Type: notification.Type,
            });
        }
    };

    const canMute = notification.EntityType !== undefined && notification.EntityId !== undefined;

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

            <div className="flex-1 min-w-0 pr-20">
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
                    {notification.IsMuted && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            • <BellOff className="h-3 w-3" /> Muted
                        </span>
                    )}
                </div>
            </div>

            {/* Action buttons */}
            <div className="absolute top-2 right-2 flex items-center gap-1">
                <TooltipProvider>
                    {canMute && (
                        notification.IsMuted ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleUnmute}
                                        disabled={removeMute.isPending}
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-primary/10 hover:text-primary"
                                        aria-label="Unmute notification"
                                    >
                                        <Bell className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Unmute {getNotificationTypeName(notification.Type)} from {getEntityTypeName(notification.EntityType)}</p>
                                </TooltipContent>
                            </Tooltip>
                        ) : (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleMute}
                                        disabled={addMute.isPending}
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-muted"
                                        aria-label="Mute notification"
                                    >
                                        <BellOff className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Mute {getNotificationTypeName(notification.Type)} from {getEntityTypeName(notification.EntityType)}</p>
                                </TooltipContent>
                            </Tooltip>
                        )
                    )}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotif.mutate(notification.Id);
                                }}
                                disabled={deleteNotif.isPending}
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-destructive/10 hover:text-destructive"
                                aria-label="Delete notification"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Delete notification</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {activeOverlay === NotificationEventEnum.FOLLOW_REQUEST && (
                <FollowRequestOverlay
                    open={true}
                    onClose={() => setActiveOverlay(null)}
                />
            )}
        </div>
    );
}
