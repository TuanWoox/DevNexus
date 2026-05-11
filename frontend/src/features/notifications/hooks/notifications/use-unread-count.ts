"use client";

import { useQuery } from "@tanstack/react-query";
import { notificationService } from "../../services/notification-service";
import { notificationQueryKeys } from "../notification-query-keys";

export function useUnreadCount() {
    return useQuery({
        queryKey: notificationQueryKeys.unreadCount(),
        queryFn: async () => {
            const res = await notificationService.getUnreadCount();
            return res.result ?? 0;
        },
    });
}
