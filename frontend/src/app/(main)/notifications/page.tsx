"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotificationsPaging } from "@/features/notifications/hooks/notifications/use-notifications-paging";
import { useUnreadCount } from "@/features/notifications/hooks/notifications/use-unread-count";
import { useMarkAllAsRead } from "@/features/notifications/hooks/notifications/use-mark-all-as-read";
import { NotificationFilter } from "@/features/notifications/hooks/notification-query-keys";
import { NotificationItem } from "@/components/notification/notification-item";
import { cn } from "@/lib/utils";

const NotificationsPage = () => {
    const [filter, setFilter] = useState<NotificationFilter>("all");
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useNotificationsPaging(filter);
    const { data: unreadCount = 0 } = useUnreadCount();
    const markAllAsRead = useMarkAllAsRead();

    const sentinelRef = useRef<HTMLDivElement>(null);
    const notifications = data?.pages.flatMap(p => p?.data ?? []) ?? [];

    useEffect(() => {
        if (!sentinelRef.current) return;
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
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    return (
        <main className="w-full min-h-screen bg-muted/30 py-6 sm:py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
                    {/* Header Section */}
                    <div className="p-6 border-b border-border">
                        <div className="mb-6">
                            <h1 className="text-4xl font-bold text-foreground">Notifications</h1>
                            <p className="text-lg text-foreground/70 mt-2">
                                Stay updated with your latest activity
                            </p>
                        </div>

                        <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
                            <nav className="flex gap-2" aria-label="Notification filters">
                                <button
                                    onClick={() => setFilter("all")}
                                    className={cn(
                                        "px-5 py-2.5 text-base font-semibold rounded-lg transition-colors",
                                        filter === "all"
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-foreground/70 hover:bg-accent hover:text-foreground",
                                    )}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilter("unread")}
                                    className={cn(
                                        "px-5 py-2.5 text-base font-semibold rounded-lg transition-colors inline-flex items-center gap-2",
                                        filter === "unread"
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-foreground/70 hover:bg-accent hover:text-foreground",
                                    )}
                                >
                                    Unread
                                    {unreadCount > 0 && (
                                        <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-bold rounded-full bg-destructive text-destructive-foreground">
                                            {unreadCount > 99 ? "99+" : unreadCount}
                                        </span>
                                    )}
                                </button>
                            </nav>

                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAllAsRead.mutate()}
                                    disabled={markAllAsRead.isPending}
                                    className="gap-2 text-base text-primary hover:text-primary hover:bg-primary/10"
                                >
                                    <CheckCheck className="h-5 w-5" />
                                    Mark all as read
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Notifications Content */}
                    <div>
                        {notifications.length === 0 && !isFetchingNextPage ? (
                            <figure className="flex flex-col items-center justify-center py-20 px-6 text-center">
                                <span className="rounded-full bg-subtle p-6 mb-4 block">
                                    <Bell className="h-12 w-12 opacity-50 text-muted-foreground" />
                                </span>
                                <figcaption>
                                    <p className="text-lg font-semibold text-heading">
                                        {filter === "unread" ? "You're all caught up" : "No notifications yet"}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {filter === "unread"
                                            ? "New unread notifications will appear here."
                                            : "When you get notifications, they'll show up here."}
                                    </p>
                                </figcaption>
                            </figure>
                        ) : (
                            <>
                                {notifications.map(n => (
                                    <NotificationItem key={n.Id} notification={n} onClose={() => { }} />
                                ))}
                                {hasNextPage && (
                                    <p ref={sentinelRef} className="h-16 flex items-center justify-center border-t border-default">
                                        {isFetchingNextPage && (
                                            <span className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent block" />
                                        )}
                                    </p>
                                )}
                                {!hasNextPage && notifications.length > 0 && (
                                    <p className="text-center py-6 text-sm text-muted-foreground border-t border-default">
                                        No more notifications
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default NotificationsPage;
