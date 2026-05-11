"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "../../services/notification-service";
import { markAsReadInCache } from "../../utils/notification-cache-helper";

export function useMarkAsRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => notificationService.markAsRead(id),
        onSuccess: (_, id) => markAsReadInCache(queryClient, id),
    });
}
