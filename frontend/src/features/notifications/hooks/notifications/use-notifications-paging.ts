"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { notificationService } from "../../services/notification-service";
import { notificationQueryKeys, NotificationFilter } from "../notification-query-keys";

const PAGE_SIZE = 20;

export function useNotificationsPaging(filter: NotificationFilter = "all") {
    return useInfiniteQuery({
        queryKey: notificationQueryKeys.list(filter),
        queryFn: async ({ pageParam = 1 }) => {
            const res = await notificationService.getNotificationsPaging({
                pageNumber: pageParam as number,
                size: PAGE_SIZE,
                selected: filter === "unread" ? ["unread"] : [],
            });
            return res.result;
        },
        getNextPageParam: (lastPage) => {
            if (!lastPage) return undefined;
            const { page, data } = lastPage;
            if (!data || data.length < PAGE_SIZE) return undefined;
            return (page?.pageNumber ?? 1) + 1;
        },
        initialPageParam: 1,
    });
}
