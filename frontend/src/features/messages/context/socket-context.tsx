"use client";

import { createContext, useContext, RefObject } from "react";
import { Socket } from "socket.io-client";

interface SocketContextValue {
    socketRef: RefObject<Socket | null>;
    isConnected: boolean;
}

export const SocketContext = createContext<SocketContextValue | null>(null);

export const useSocket = () => {
    const ctx = useContext(SocketContext);
    if (!ctx) throw new Error("useSocket must be used within SocketContext.Provider");
    return ctx;
};
