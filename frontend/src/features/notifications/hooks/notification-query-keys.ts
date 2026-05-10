export type NotificationFilter = "all" | "unread";

export const notificationQueryKeys = {
    all: ["notifications"] as const,
    list: (filter: NotificationFilter) => [...notificationQueryKeys.all, "list", filter] as const,
    unreadCount: () => [...notificationQueryKeys.all, "unreadCount"] as const,
};
