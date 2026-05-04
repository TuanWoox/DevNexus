"use client";

import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";

type WindowState = "open" | "minimized";

export interface ChatWindowEntry {
    chatId: string;
    state: WindowState;
}

interface ChatWindowsContextValue {
    windows: ChatWindowEntry[];
    unreadCounts: Record<string, number>;
    openChat: (chatId: string) => void;
    closeChat: (chatId: string) => void;
    minimizeChat: (chatId: string) => void;
    restoreChat: (chatId: string) => void;
    incrementUnread: (chatId: string) => void;
    isOpen: (chatId: string) => boolean;
}

const ChatWindowsContext = createContext<ChatWindowsContextValue | null>(null);
const MAX_WINDOWS = 3;

export function ChatWindowsProvider({ children }: { children: ReactNode }) {
    const [windows, setWindows] = useState<ChatWindowEntry[]>([]);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const pathname = usePathname();
    const isMessagesPage = pathname.startsWith("/messages");

    const activeWindows = useMemo(
        () => isMessagesPage ? [] : windows,
        [isMessagesPage, windows],
    );
    const activeUnreadCounts = useMemo(
        () => isMessagesPage ? {} : unreadCounts,
        [isMessagesPage, unreadCounts],
    );

    const openChat = useCallback((chatId: string) => {
        setWindows(prev => {
            const existing = prev.find(w => w.chatId === chatId);
            if (existing) return prev;
            const next = [...prev, { chatId, state: "open" as WindowState }];
            return next.slice(-MAX_WINDOWS);
        });
    }, []);

    const closeChat = useCallback((chatId: string) => {
        setWindows(prev => prev.filter(w => w.chatId !== chatId));
        setUnreadCounts(prev => { const n = { ...prev }; delete n[chatId]; return n; });
    }, []);

    const minimizeChat = useCallback((chatId: string) => {
        setWindows(prev => prev.map(w =>
            w.chatId === chatId ? { ...w, state: "minimized" as WindowState } : w
        ));
    }, []);

    const restoreChat = useCallback((chatId: string) => {
        setWindows(prev => prev.map(w =>
            w.chatId === chatId ? { ...w, state: "open" as WindowState } : w
        ));
        setUnreadCounts(prev => { const n = { ...prev }; delete n[chatId]; return n; });
    }, []);

    const incrementUnread = useCallback((chatId: string) => {
        setUnreadCounts(prev => ({ ...prev, [chatId]: (prev[chatId] ?? 0) + 1 }));
    }, []);

    const isOpen = useCallback((chatId: string) =>
        activeWindows.some(w => w.chatId === chatId), [activeWindows]);

    return (
        <ChatWindowsContext.Provider value={{ windows: activeWindows, unreadCounts: activeUnreadCounts, openChat, closeChat, minimizeChat, restoreChat, incrementUnread, isOpen }}>
            {children}
        </ChatWindowsContext.Provider>
    );
}

export function useChatWindows() {
    const ctx = useContext(ChatWindowsContext);
    if (!ctx) throw new Error("useChatWindows must be used within ChatWindowsProvider");
    return ctx;
}
