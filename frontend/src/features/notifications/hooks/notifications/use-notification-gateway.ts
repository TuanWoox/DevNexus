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
