"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "../services/notification-service";
import { removeNotificationFromCache } from "../utils/notification-cache-helper";

export function useDeleteNotification() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => notificationService.deleteNotification(id),
        onSuccess: (_, id) => removeNotificationFromCache(queryClient, id),
    });
}
