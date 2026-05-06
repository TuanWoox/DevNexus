"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Notification } from "@/features/notifications/types/contracts";
import { useMarkAsRead } from "@/features/notifications/hooks/use-mark-as-read";
import { useDeleteNotification } from "@/features/notifications/hooks/use-delete-notification";
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

    const handleClick = () => {
        if (!notification.IsRead) markAsRead.mutate(notification.Id);
        if (notification.ActionUrl) {
            router.push(notification.ActionUrl);
            onClose();
        }
    };

    return (
        <div
            onClick={handleClick}
            className={cn(
                "flex items-start gap-3 p-3 hover:bg-subtle cursor-pointer transition-colors group relative",
                !notification.IsRead && "bg-primary/5",
            )}
        >
            <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={notification.ActorAvatarUrl || undefined} alt={notification.ActorName ?? "User"} />
                <AvatarFallback className="bg-primary/20 text-primary font-semibold text-sm">
                    {notification.ActorName?.charAt(0)?.toUpperCase() ?? "U"}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 pr-8">
                <p className="text-sm text-body leading-relaxed">
                    {notification.Message}
                    {notification.AggregatedCount > 1 && (
                        <span className="ml-1 text-primary font-semibold">
                            and {notification.AggregatedCount - 1} other{notification.AggregatedCount > 2 ? "s" : ""}
                        </span>
                    )}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">
                        {toRelativeTime(notification.DateCreated)}
                    </p>
                    {!notification.IsRead && (
                        <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-semibold">
                            New
                        </Badge>
                    )}
                </div>
            </div>

            <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                    e.stopPropagation();
                    deleteNotif.mutate(notification.Id);
                }}
                disabled={deleteNotif.isPending}
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                aria-label="Delete notification"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </Button>
        </div>
    );
}
