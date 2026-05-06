"use client";

import { useEffect, useRef, useState } from "react";
import { X, Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNotificationsPaging } from "@/features/notifications/hooks/use-notifications-paging";
import { useUnreadCount } from "@/features/notifications/hooks/use-unread-count";
import { useMarkAllAsRead } from "@/features/notifications/hooks/use-mark-all-as-read";
import { NotificationFilter } from "@/features/notifications/hooks/notification-query-keys";
import { NotificationItem } from "./notification-item";
import { cn } from "@/lib/utils";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: Props) {
    const [filter, setFilter] = useState<NotificationFilter>("all");
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useNotificationsPaging(filter);
    const { data: unreadCount = 0 } = useUnreadCount();
    const markAllAsRead = useMarkAllAsRead();

    const sentinelRef = useRef<HTMLDivElement>(null);
    const notifications = data?.pages.flatMap(p => p?.data ?? []) ?? [];

    useEffect(() => {
        if (!isOpen || !sentinelRef.current) return;
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 },
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [isOpen, hasNextPage, isFetchingNextPage, fetchNextPage]);

    return (
        <aside
            className={cn(
                "fixed top-0 left-[72px] h-screen bg-card border-r border-default shadow-lg z-40 flex flex-col transition-all duration-300",
                isOpen ? "w-[400px] opacity-100" : "w-0 opacity-0 pointer-events-none",
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 shrink-0">
                <h2 className="text-xl font-bold text-heading">Notifications</h2>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    aria-label="Close"
                    className="h-8 w-8 rounded-lg"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <Separator />

            {/* Filter tabs */}
            <div className="flex shrink-0 px-2 pt-2 gap-1">
                <Button
                    variant={filter === "all" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setFilter("all")}
                    className="flex-1 rounded-full font-semibold"
                >
                    All
                </Button>
                <Button
                    variant={filter === "unread" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setFilter("unread")}
                    className="flex-1 rounded-full font-semibold gap-1.5"
                >
                    Unread
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="h-5 min-w-5 px-1.5 text-[10px] font-bold rounded-full"
                        >
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </div>

            {/* Mark all as read */}
            {unreadCount > 0 && (
                <div className="px-3 pt-2 pb-1 shrink-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAllAsRead.mutate()}
                        disabled={markAllAsRead.isPending}
                        className="w-full justify-start gap-2 text-primary hover:text-primary"
                    >
                        <CheckCheck className="h-4 w-4" />
                        Mark all as read
                    </Button>
                </div>
            )}

            <Separator />

            {/* List */}
            <div className="overflow-y-auto flex-1">
                {notifications.length === 0 && !isFetchingNextPage ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground px-6 text-center">
                        <div className="rounded-full bg-subtle p-4 mb-4">
                            <Bell className="h-10 w-10 opacity-50" />
                        </div>
                        <p className="text-sm font-medium text-heading">
                            {filter === "unread" ? "You're all caught up" : "No notifications yet"}
                        </p>
                        <p className="text-xs mt-1">
                            {filter === "unread"
                                ? "New unread notifications will appear here."
                                : "When you get notifications, they'll show up here."}
                        </p>
                    </div>
                ) : (
                    <>
                        {notifications.map(n => (
                            <NotificationItem key={n.Id} notification={n} onClose={onClose} />
                        ))}
                        {hasNextPage && (
                            <div ref={sentinelRef} className="h-16 flex items-center justify-center">
                                {isFetchingNextPage && (
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                                )}
                            </div>
                        )}
                        {!hasNextPage && notifications.length > 0 && (
                            <div className="text-center py-4 text-xs text-muted-foreground">
                                No more notifications
                            </div>
                        )}
                    </>
                )}
            </div>

            <Separator />

            {/* Footer */}
            <div className="p-3 shrink-0">
                <Button
                    asChild
                    variant="ghost"
                    className="w-full text-primary hover:text-primary font-semibold"
                >
                    <Link href="/notifications" onClick={onClose}>
                        View all notifications
                    </Link>
                </Button>
            </div>
        </aside>
    );
}
