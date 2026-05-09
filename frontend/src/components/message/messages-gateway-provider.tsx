"use client";

import { ReactNode } from "react";
import { useMessageGateway } from "@/features/messages/hooks/gateways/use-message-gateway";
import { SocketContext } from "@/features/messages/context/socket-context";
import { ChatWindowsProvider } from "@/features/messages/context/chat-windows-context";
import { NotificationHost } from "@/components/message/notification-host";
import { ChatWindowsHost } from "@/components/message/chat-windows-host";

export function MessagesGatewayProvider({ children }: { children: ReactNode }) {
    const { socketRef, isConnected } = useMessageGateway();

    return (
        <SocketContext.Provider value={{ socketRef, isConnected }}>
            <ChatWindowsProvider>
                {children}
                <NotificationHost />
                <ChatWindowsHost />
            </ChatWindowsProvider>
        </SocketContext.Provider>
    );
}
