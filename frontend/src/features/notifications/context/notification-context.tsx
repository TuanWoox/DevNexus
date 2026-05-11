"use client";

import { createContext, useContext, RefObject } from "react";
import { Socket } from "socket.io-client";

interface NotificationContextValue {
    socketRef: RefObject<Socket | null>;
    isConnected: boolean;
}

export const NotificationContext = createContext<NotificationContextValue | null>(null);

export const useNotificationSocket = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error("useNotificationSocket must be used within NotificationContext.Provider");
    return ctx;
};
