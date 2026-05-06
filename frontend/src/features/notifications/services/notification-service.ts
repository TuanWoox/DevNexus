import notificationApi from "@/lib/notificationServiceAxiosConfig";
import type { Notification } from "../types/contracts";
import type { Page } from "@/types/common/page";
import type { PagedData } from "@/types/common/paged-data";
import type { ReturnResult } from "@/types/common/return-result";

export const notificationService = {
    getNotificationsPaging: async (
        page: Page<string>,
    ): Promise<ReturnResult<PagedData<Notification, string>>> => {
        const { data } = await notificationApi.post<ReturnResult<PagedData<Notification, string>>>(
            "/notifications/paging",
            page,
        );
        return data;
    },

    getUnreadCount: async (): Promise<ReturnResult<number>> => {
        const { data } = await notificationApi.get<ReturnResult<number>>(
            "/notifications/unread-count",
        );
        return data;
    },

    markAsRead: async (id: string): Promise<ReturnResult<boolean>> => {
        const { data } = await notificationApi.patch<ReturnResult<boolean>>(
            `/notifications/${id}/read`,
        );
        return data;
    },

    markAllAsRead: async (): Promise<ReturnResult<number>> => {
        const { data } = await notificationApi.patch<ReturnResult<number>>(
            "/notifications/mark-all-read",
        );
        return data;
    },

    deleteNotification: async (id: string): Promise<ReturnResult<boolean>> => {
        const { data } = await notificationApi.delete<ReturnResult<boolean>>(
            `/notifications/${id}`,
        );
        return data;
    },
};
