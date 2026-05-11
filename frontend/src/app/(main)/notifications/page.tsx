"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
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
        <main className="min-h-screen bg-background">
            <section className="max-w-4xl mx-auto px-4 py-8">
                <header className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-heading">Notifications</h1>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAllAsRead.mutate()}
                            disabled={markAllAsRead.isPending}
                            className="gap-2 text-primary hover:text-primary hover:bg-primary/10"
                        >
                            <CheckCheck className="h-4 w-4" />
                            Mark all as read
                        </Button>
                    )}
                </header>

                <nav className="flex gap-2 mb-4" aria-label="Notification filters">
                    <button
                        onClick={() => setFilter("all")}
                        className={cn(
                            "px-5 py-2 text-sm font-semibold rounded-lg transition-colors",
                            filter === "all"
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-subtle hover:text-heading",
                        )}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter("unread")}
                        className={cn(
                            "px-5 py-2 text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5",
                            filter === "unread"
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-subtle hover:text-heading",
                        )}
                    >
                        Unread
                        {unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </button>
                </nav>

                <Separator className="mb-4" />

                <Card className="gap-0 overflow-hidden py-0">
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
                </Card>
            </section>
        </main>
    );
};

export default NotificationsPage;
