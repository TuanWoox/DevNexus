"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "../services/notification-service";
import { markAllAsReadInCache } from "../utils/notification-cache-helper";

export function useMarkAllAsRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => notificationService.markAllAsRead(),
        onSuccess: () => markAllAsReadInCache(queryClient),
    });
}
