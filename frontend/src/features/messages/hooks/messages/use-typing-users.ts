"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/features/messages/context/socket-context";

export interface TypingUser {
    profileId: string;
    FullName: string;
    AvatarUrl: string | null;
}

interface TypingStartPayload {
    chatId: string;
    profileId: string;
    FullName: string;
    AvatarUrl: string | null;
}

interface TypingStopPayload {
    chatId: string;
    profileId: string;
}

export function useTypingUsers(chatId: string) {
    const { socketRef, isConnected } = useSocket();
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
    const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    useEffect(() => {
        const socket = socketRef.current;
        if (!socket || !isConnected) return;

        const timers = timersRef.current;

        const onTypingStart = (payload: TypingStartPayload) => {
            if (payload.chatId !== chatId) return;

            setTypingUsers(prev => {
                if (prev.some(u => u.profileId === payload.profileId)) return prev;
                return [...prev, { profileId: payload.profileId, FullName: payload.FullName, AvatarUrl: payload.AvatarUrl }];
            });

            // Reset per-user auto-clear timer
            const existing = timers.get(payload.profileId);
            if (existing) clearTimeout(existing);
            const timer = setTimeout(() => {
                setTypingUsers(prev => prev.filter(u => u.profileId !== payload.profileId));
                timers.delete(payload.profileId);
            }, 5000);
            timers.set(payload.profileId, timer);
        };

        const onTypingStop = (payload: TypingStopPayload) => {
            if (payload.chatId !== chatId) return;

            const existing = timers.get(payload.profileId);
            if (existing) {
                clearTimeout(existing);
                timers.delete(payload.profileId);
            }
            setTypingUsers(prev => prev.filter(u => u.profileId !== payload.profileId));
        };

        socket.on("typing-start", onTypingStart);
        socket.on("typing-stop", onTypingStop);

        return () => {
            socket.off("typing-start", onTypingStart);
            socket.off("typing-stop", onTypingStop);
            timers.forEach(t => clearTimeout(t));
            timers.clear();
            setTypingUsers([]);
        };
    }, [chatId, socketRef, isConnected]);

    return typingUsers;
}
