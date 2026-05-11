"use client";

import { useEffect, useRef, useState } from "react";
import { X, Bell, CheckCheck, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNotificationsPaging } from "@/features/notifications/hooks/notifications/use-notifications-paging";
import { useUnreadCount } from "@/features/notifications/hooks/notifications/use-unread-count";
import { useMarkAllAsRead } from "@/features/notifications/hooks/notifications/use-mark-all-as-read";
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
        <>
            {isOpen && (
                <div
                    className="fixed top-0 right-0 bottom-0 left-118 z-39 bg-background/80 backdrop-blur-sm"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}
            <aside
                className={cn(
                    "fixed top-0 left-18 h-screen bg-card border-r border-default shadow-elevated z-40 flex flex-col transition-all duration-300",
                    isOpen ? "w-100 opacity-100" : "w-0 opacity-0 pointer-events-none",
                )}
            >
                <header className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-default">
                    <h2 className="text-lg font-bold text-heading">Notifications</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        aria-label="Close"
                        className="h-8 w-8 rounded-lg hover:bg-subtle"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </header>

                <nav className="flex shrink-0 px-3 pt-3 gap-2" aria-label="Notification filters">
                    <button
                        onClick={() => setFilter("all")}
                        className={cn(
                            "flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-colors",
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
                            "flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-1.5",
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

                {unreadCount > 0 && (
                    <section className="px-3 pt-2 pb-1 shrink-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAllAsRead.mutate()}
                            disabled={markAllAsRead.isPending}
                            className="w-full justify-start gap-2 text-primary hover:text-primary hover:bg-primary/10"
                        >
                            <CheckCheck className="h-4 w-4" />
                            Mark all as read
                        </Button>
                    </section>
                )}

                <Separator className="my-2" />

                <section className="overflow-y-auto flex-1">
                    {notifications.length === 0 && !isFetchingNextPage ? (
                        <figure className="flex flex-col items-center justify-center h-64 text-muted-foreground px-6 text-center">
                            <span className="rounded-full bg-subtle p-4 mb-3 block">
                                <Bell className="h-10 w-10 opacity-50" />
                            </span>
                            <figcaption>
                                <p className="text-sm font-semibold text-heading">
                                    {filter === "unread" ? "You're all caught up" : "No notifications yet"}
                                </p>
                                <p className="text-xs mt-1">
                                    {filter === "unread"
                                        ? "New unread notifications will appear here."
                                        : "When you get notifications, they'll show up here."}
                                </p>
                            </figcaption>
                        </figure>
                    ) : (
                        <>
                            {notifications.map(n => (
                                <NotificationItem key={n.Id} notification={n} onClose={onClose} />
                            ))}
                            {hasNextPage && (
                                <p ref={sentinelRef} className="h-16 flex items-center justify-center">
                                    {isFetchingNextPage && (
                                        <span className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent block" />
                                    )}
                                </p>
                            )}
                            {!hasNextPage && notifications.length > 0 && (
                                <p className="text-center py-4 text-xs text-muted-foreground">
                                    No more notifications
                                </p>
                            )}
                        </>
                    )}
                </section>

                <Separator />

                <footer className="p-3 shrink-0 flex flex-col gap-2">
                    <Button
                        asChild
                        variant="ghost"
                        className="w-full text-primary hover:text-primary hover:bg-primary/10 font-semibold"
                    >
                        <Link href="/notifications" onClick={onClose}>
                            View all notifications
                        </Link>
                    </Button>
                    <Link href="/notifications/settings" onClick={onClose}>
                        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:bg-subtle">
                            <Settings className="h-4 w-4 mr-2" />
                            Notification Settings
                        </Button>
                    </Link>
                </footer>
            </aside>
        </>
    );
}
