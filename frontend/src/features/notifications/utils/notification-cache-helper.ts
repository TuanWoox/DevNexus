import { QueryClient, InfiniteData } from "@tanstack/react-query";
import { Notification } from "../types/contracts";
import { PagedData } from "@/types/common/paged-data";
import { notificationQueryKeys, NotificationFilter } from "../hooks/notification-query-keys";

const NOTIFICATION_PAGE_SIZE = 20;

export function prependNotificationToCache(queryClient: QueryClient, notification: Notification) {
    // Update both "all" and "unread" caches (if they exist)
    const filters: NotificationFilter[] = ["all", "unread"];

    for (const filter of filters) {
        const cacheKey = notificationQueryKeys.list(filter);
        const oldData = queryClient.getQueryData<InfiniteData<PagedData<Notification, string>>>(cacheKey);

        // User hasn't opened this tab yet
        if (!oldData?.pages?.length) continue;

        const loadedPageCount = oldData.pages.length;

        // Flatten all pages into one array
        const allNotifications: Notification[] = oldData.pages.flatMap(p => p?.data ?? []);

        // Remove existing notification with same Id or GroupKey (aggregation case)
        const existingIndex = allNotifications.findIndex(n =>
            n.Id === notification.Id ||
            (notification.GroupKey && n.GroupKey === notification.GroupKey)
        );
        if (existingIndex !== -1) {
            allNotifications.splice(existingIndex, 1);
        }

        // For "unread" cache: only insert if notification is unread
        if (filter === "unread" && notification.IsRead) {
            // Notification is read — just remove it (already done above), don't re-insert
        } else {
            // Insert at top
            allNotifications.unshift(notification);
        }

        // Trim to loaded boundary — overflow served by server on next fetchNextPage
        const maxItems = loadedPageCount * NOTIFICATION_PAGE_SIZE;
        const trimmed = allNotifications.slice(0, maxItems);

        // Redistribute back into pages
        const newPages = oldData.pages.map((page, pageIndex) => {
            const start = pageIndex * NOTIFICATION_PAGE_SIZE;
            const pageData = trimmed.slice(start, start + NOTIFICATION_PAGE_SIZE);
            return {
                ...page,
                data: pageData,
            };
        });

        queryClient.setQueryData<InfiniteData<PagedData<Notification, string>>>(cacheKey, {
            ...oldData,
            pages: newPages,
        });
    }

    // Update unread count: increment if new notification is unread
    if (!notification.IsRead) {
        const currentCount = queryClient.getQueryData<number>(notificationQueryKeys.unreadCount()) ?? 0;
        queryClient.setQueryData(notificationQueryKeys.unreadCount(), currentCount + 1);
    }
}

export function removeNotificationFromCache(queryClient: QueryClient, id: string) {
    const filters: NotificationFilter[] = ["all", "unread"];
    let removedWasUnread = false;

    for (const filter of filters) {
        const cacheKey = notificationQueryKeys.list(filter);
        const oldData = queryClient.getQueryData<InfiniteData<PagedData<Notification, string>>>(cacheKey);
        if (!oldData?.pages?.length) continue;

        // Detect if removed item was unread (only need to check one cache)
        if (filter === "all" && !removedWasUnread) {
            const found = oldData.pages.flatMap(p => p?.data ?? []).find(n => n.Id === id);
            if (found && !found.IsRead) removedWasUnread = true;
        }

        queryClient.setQueryData<InfiniteData<PagedData<Notification, string>>>(cacheKey, {
            ...oldData,
            pages: oldData.pages.map(page => ({
                ...page,
                data: page.data.filter(n => n.Id !== id),
            })),
        });
    }

    // Decrement unread count if the removed notification was unread
    if (removedWasUnread) {
        const currentCount = queryClient.getQueryData<number>(notificationQueryKeys.unreadCount()) ?? 0;
        queryClient.setQueryData(notificationQueryKeys.unreadCount(), Math.max(0, currentCount - 1));
    }
}

export function setUnreadCountInCache(queryClient: QueryClient, count: number) {
    queryClient.setQueryData(notificationQueryKeys.unreadCount(), count);
}

export function markAsReadInCache(queryClient: QueryClient, id: string) {
    // Update "all" cache: flip IsRead flag in place
    const allKey = notificationQueryKeys.list("all");
    const allData = queryClient.getQueryData<InfiniteData<PagedData<Notification, string>>>(allKey);
    if (allData?.pages?.length) {
        queryClient.setQueryData<InfiniteData<PagedData<Notification, string>>>(allKey, {
            ...allData,
            pages: allData.pages.map(page => ({
                ...page,
                data: page.data.map(n =>
                    n.Id === id ? { ...n, IsRead: true, ReadAt: new Date().toISOString() } : n
                ),
            })),
        });
    }

    // Update "unread" cache: remove the notification (it's no longer unread)
    const unreadKey = notificationQueryKeys.list("unread");
    const unreadData = queryClient.getQueryData<InfiniteData<PagedData<Notification, string>>>(unreadKey);
    if (unreadData?.pages?.length) {
        queryClient.setQueryData<InfiniteData<PagedData<Notification, string>>>(unreadKey, {
            ...unreadData,
            pages: unreadData.pages.map(page => ({
                ...page,
                data: page.data.filter(n => n.Id !== id),
            })),
        });
    }

    // Decrement unread count
    const currentCount = queryClient.getQueryData<number>(notificationQueryKeys.unreadCount()) ?? 0;
    queryClient.setQueryData(notificationQueryKeys.unreadCount(), Math.max(0, currentCount - 1));
}

export function markAllAsReadInCache(queryClient: QueryClient) {
    // Update "all" cache: flip IsRead flag on every notification
    const allKey = notificationQueryKeys.list("all");
    const allData = queryClient.getQueryData<InfiniteData<PagedData<Notification, string>>>(allKey);
    if (allData?.pages?.length) {
        queryClient.setQueryData<InfiniteData<PagedData<Notification, string>>>(allKey, {
            ...allData,
            pages: allData.pages.map(page => ({
                ...page,
                data: page.data.map(n => ({ ...n, IsRead: true, ReadAt: new Date().toISOString() })),
            })),
        });
    }

    // Clear "unread" cache: every page becomes empty
    const unreadKey = notificationQueryKeys.list("unread");
    const unreadData = queryClient.getQueryData<InfiniteData<PagedData<Notification, string>>>(unreadKey);
    if (unreadData?.pages?.length) {
        queryClient.setQueryData<InfiniteData<PagedData<Notification, string>>>(unreadKey, {
            ...unreadData,
            pages: unreadData.pages.map(page => ({ ...page, data: [] })),
        });
    }

    // Reset unread count
    queryClient.setQueryData(notificationQueryKeys.unreadCount(), 0);
}

export function updateMuteStatusInCache(
    queryClient: QueryClient,
    entityType: number,
    entityId: string,
    type: number,
    isMuted: boolean
) {
    const filters: NotificationFilter[] = ["all", "unread"];
    let updated = false;

    for (const filter of filters) {
        const cacheKey = notificationQueryKeys.list(filter);
        const oldData = queryClient.getQueryData<InfiniteData<PagedData<Notification, string>>>(cacheKey);
        if (!oldData?.pages?.length) continue;

        const newPages = oldData.pages.map(page => {
            const newData = page.data.map(n => {
                // Check if this notification matches the mute criteria
                if (
                    n.EntityType === entityType &&
                    n.EntityId === entityId &&
                    n.Type === type
                ) {
                    updated = true;
                    return { ...n, IsMuted: isMuted };
                }
                return n;
            });

            return { ...page, data: newData };
        });

        queryClient.setQueryData<InfiniteData<PagedData<Notification, string>>>(cacheKey, {
            ...oldData,
            pages: newPages,
        });
    }

    // Only invalidate mute settings if we actually updated something
    if (updated) {
        queryClient.invalidateQueries({ queryKey: ['notification-settings', 'mutes'] });
    }
}
