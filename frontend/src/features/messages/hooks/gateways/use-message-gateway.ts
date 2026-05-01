"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { RootState } from "@/store/store";
import { messagingQueryKeys } from "../messaging-query-keys";
import type { InfiniteData } from "@tanstack/react-query";
import type { ReturnResult } from "@/types/common/return-result";
import type { Message, PagedData } from "../../types/contracts";
import { getProfileId, getWsBaseUrl } from "../../utils/message-service.helper";
import {
    prependMessageToCache,
    invalidateInbox,
    invalidateAllChats,
} from "../../utils/message-cache-helper";

type MessagesInfiniteData = InfiniteData<
    ReturnResult<PagedData<number, Message>>
>;

export function useMessageGateway() {
    const socketRef = useRef<Socket | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const token = useSelector((state: RootState) => state.auth.accessToken);
    const currentProfileId = useSelector((state: RootState) =>
        getProfileId(state.auth.user?.profileId),
    );
    const queryClient = useQueryClient();

    // 🔊 preload audio
    useEffect(() => {
        audioRef.current = new Audio("/sounds/receive.mp3");
        audioRef.current.preload = "auto";
    }, []);

    // 🔓 unlock audio on first user interaction (fix autoplay restrictions)
    useEffect(() => {
        const unlockAudio = () => {
            if (audioRef.current) {
                audioRef.current
                    .play()
                    .then(() => {
                        audioRef.current?.pause();
                        if (audioRef.current) {
                            audioRef.current.currentTime = 0;
                        }
                    })
                    .catch(() => { });
            }
            window.removeEventListener("click", unlockAudio);
        };

        window.addEventListener("click", unlockAudio);

        return () => {
            window.removeEventListener("click", unlockAudio);
        };
    }, []);

    useEffect(() => {
        if (!token || !currentProfileId) return;

        const wsUrl = getWsBaseUrl();

        const socket = io(`${wsUrl}/message-chat`, {
            auth: { token },
            transports: ["websocket"],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
            reconnectionAttempts: Infinity,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            setIsConnected(true);
        });

        socket.on("new-message", (message: Message) => {
            //Only allow to sounding when the message is in main inbox and not mute 
            if (!message?.Chat?.ChatSettings?.[0].IsMuted && !message?.Chat?.ChatSettings?.[0].IsArchived
                && !message?.Chat?.ChatSettings?.[0].IsRequested) {
                // 🔊 play sound safely
                if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(() => { });
                }
            }

            // 📨 update cache
            const chatKey = messagingQueryKeys.chat("", message.ChatId);

            queryClient.setQueryData<MessagesInfiniteData>(
                chatKey,
                (oldData) => prependMessageToCache(oldData, message),
            );

            invalidateInbox(queryClient);
        });

        socket.on("messages-read", () => {
            invalidateAllChats(queryClient);
        });

        socket.on("disconnect", () => {
            setIsConnected(false);
        });

        socket.on("connect_error", (err) => {
            console.error("[MessageGateway] Connection error:", err.message);
            setIsConnected(false);
        });

        return () => {
            socket.removeAllListeners();
            socket.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        };
    }, [token, currentProfileId, queryClient]);

    return { isConnected };
}