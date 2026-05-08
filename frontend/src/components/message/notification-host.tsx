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
            const isMuted = message?.Chat?.ChatSettings?.[0]?.IsMuted ?? false;
            const existing = windows.find(w => w.chatId === message.ChatId);

            if (!existing) {
                // No window yet — open only if not muted
                if (!isMuted) openChat(message.ChatId);
            } else if (existing.state === "minimized") {
                // Already minimized — always increment badge regardless of mute
                incrementUnread(message.ChatId);
            }
            // state === "open" — message appends into thread automatically
        };
        window.addEventListener("new-message-notification", handler);
        return () => window.removeEventListener("new-message-notification", handler);
    }, [isOnMessagesPage, windows, openChat, incrementUnread]);

    return null;
}
