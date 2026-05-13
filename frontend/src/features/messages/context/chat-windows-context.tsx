"use client";

import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";

type WindowState = "open" | "minimized";

export interface NewChatProfileData {
    id: string;
    fullName: string;
    avatarUrl?: string;
}

export interface ChatWindowEntry {
    chatId: string;
    state: WindowState;
    type: "existing" | "new";
    profileData?: NewChatProfileData;
}

interface ChatWindowsContextValue {
    windows: ChatWindowEntry[];
    unreadCounts: Record<string, number>;
    openChat: (chatId: string, profileData?: NewChatProfileData) => void;
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

    const openChat = useCallback((chatId: string, profileData?: NewChatProfileData) => {
        setWindows(prev => {
            const existing = prev.find(w => w.chatId === chatId);
            const isNewChat = chatId.startsWith("new-");
            if (existing) {
                return prev.map(w =>
                    w.chatId === chatId
                        ? {
                            ...w,
                            state: "open" as WindowState,
                            profileData: isNewChat ? profileData ?? w.profileData : undefined,
                        }
                        : w
                );
            }
            const next = [...prev, {
                chatId,
                state: "open" as WindowState,
                type: isNewChat ? "new" as const : "existing" as const,
                profileData: isNewChat ? profileData : undefined,
            }];
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
