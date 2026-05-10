"use client";

import { ReactNode } from "react";
import { useNotificationGateway } from "@/features/notifications/hooks/use-notification-gateway";
import { NotificationContext } from "@/features/notifications/context/notification-context";
import { NotificationToastHost } from "./notification-toast-host";

export function NotificationGatewayProvider({ children }: { children: ReactNode }) {
    const { socketRef, isConnected } = useNotificationGateway();

    return (
        <NotificationContext.Provider value={{ socketRef, isConnected }}>
            <NotificationToastHost />
            {children}
        </NotificationContext.Provider>
    );
}
