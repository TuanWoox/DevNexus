"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { RootState } from "@/store/store";
import type { Message } from "../../types/contracts";
import { getProfileId, getWsBaseUrl } from "../../utils/message-service.helper";
import {
    appendMessageToChatCache,
    appendReadReceiptToChatListItem,
    appendReadReceiptToMessage
} from "../../utils/message-cache-helper";

interface MessageReadPayload {
    messageId: number;
    readerId: string;
    chatId: string;
    reader: { FullName: string; AvatarUrl: string | null };
}

export function useMessageGateway() {
    const socketRef = useRef<Socket | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const token = useSelector((state: RootState) => state.auth.accessToken);
    const currentProfileId = useSelector((state: RootState) =>
        getProfileId(state.auth.user?.profileId),
    );
    const queryClient = useQueryClient();

    useEffect(() => {
        audioRef.current = new Audio("/sounds/receive.mp3");
        audioRef.current.preload = "auto";
    }, []);

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
            if (!message?.Chat?.ChatSettings?.[0].IsMuted && !message?.Chat?.ChatSettings?.[0].IsArchived
                && !message?.Chat?.ChatSettings?.[0].IsRequested) {
                if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(() => { });
                }
            }

            appendMessageToChatCache(queryClient, message);
        });

        socket.on("message-read", (payload: MessageReadPayload) => {
            const receipt = {
                ReaderId: payload.readerId,
                ReadAt: new Date().toISOString(),
                Reader: payload.reader,
            };

            appendReadReceiptToMessage(queryClient, payload.chatId, payload.messageId, receipt);
            appendReadReceiptToChatListItem(queryClient, payload.chatId, payload.messageId, receipt);
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
