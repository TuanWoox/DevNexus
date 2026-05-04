"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useChatWindows } from "@/features/messages/context/chat-windows-context";
import type { Message } from "@/features/messages/types/contracts";

export function NotificationHost() {
    const pathname = usePathname();
    const { windows, openChat, incrementUnread } = useChatWindows();
    const isOnMessagesPage = pathname.startsWith("/messages");

    useEffect(() => {
        const handler = (e: Event) => {
            if (isOnMessagesPage) return;
            const message = (e as CustomEvent<Message>).detail;
            const existing = windows.find(w => w.chatId === message.ChatId);

            if (!existing) {
                // New chat — open window
                openChat(message.ChatId);
            } else if (existing.state === "minimized") {
                // Already minimized — just increment badge, don't pop up
                incrementUnread(message.ChatId);
            }
            // state === "open" — message appends into thread automatically, nothing to do
        };
        window.addEventListener("new-message-notification", handler);
        return () => window.removeEventListener("new-message-notification", handler);
    }, [isOnMessagesPage, windows, openChat, incrementUnread]);

    return null;
}
