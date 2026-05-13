"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { RootState } from "@/store/store";
import type { Notification } from "../../types/contracts";
import { getWsBaseUrl } from "../../utils/notification-service.helper";
import {
    prependNotificationToCache,
    setUnreadCountInCache,
} from "../../utils/notification-cache-helper";
import { NotificationEventEnum } from "../../types/enums";
import { updatePostModerationStatusInCache } from "@/hooks/post-hooks/post-cache-helper";
import { ModerationStatus, normalizeModerationStatus } from "@/types/post/moderation-status";
import { postQueryKeys } from "@/hooks/post-hooks";
import { qaPostQueryKeys } from "@/hooks/qa-post-hooks/use-qa-post-query-key";

function parseModerationStatus(value: string | undefined): Exclude<ModerationStatus, number> | null {
    if (value === "Pending" || value === "Approved" || value === "Flagged" || value === "InReview") {
        return value;
    }

    if (value === "0" || value === "1" || value === "2" || value === "3") {
        return normalizeModerationStatus(Number(value) as ModerationStatus);
    }

    return null;
}

export function useNotificationGateway() {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const token = useSelector((state: RootState) => state.auth.accessToken);
    const currentProfileId = useSelector((state: RootState) => state.auth.user?.profileId);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!token || !currentProfileId) return;

        const wsUrl = getWsBaseUrl();
        const socket = io(`${wsUrl}/notifications`, {
            auth: { token },
            transports: ["websocket"],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
            reconnectionAttempts: Infinity,
        });

        socketRef.current = socket;

        socket.on("connect", () => setIsConnected(true));

        socket.on("notification:new", (notification: Notification) => {
            // prependNotificationToCache handles both fresh inserts and aggregation
            // (removes existing entry with same Id or GroupKey, then inserts at top)
            prependNotificationToCache(queryClient, notification);

            if (notification.Type === NotificationEventEnum.MODERATION_RESULT && notification.EntityId) {
                const moderationStatus = parseModerationStatus(notification.EntityPreview);
                if (moderationStatus) {
                    updatePostModerationStatusInCache(queryClient, notification.EntityId, moderationStatus);
                }

                queryClient.invalidateQueries({ queryKey: postQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: postQueryKeys.detail(notification.EntityId) });
                queryClient.invalidateQueries({ queryKey: qaPostQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: qaPostQueryKeys.detail(notification.EntityId) });
            }

            // Dispatch event for NotificationToastHost
            window.dispatchEvent(new CustomEvent("new-notification", { detail: notification }));
        });

        socket.on("notification:unread-count", (count: number) => {
            setUnreadCountInCache(queryClient, count);
        });

        socket.on("disconnect", () => setIsConnected(false));
        socket.on("connect_error", (err) => {
            console.error("[NotificationGateway] Connection error:", err.message);
            setIsConnected(false);
        });

        return () => {
            socket.removeAllListeners();
            socket.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        };
    }, [token, currentProfileId, queryClient]);

    return { socketRef, isConnected };
}
