"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { RootState } from "@/store/store";
import type { ChatSetting, Message } from "../../types/contracts";
import { getProfileId, getWsBaseUrl } from "../../utils/message-service.helper";
import {
    appendMessageToChatCache,
    appendReadReceiptToChatListItem,
    appendReadReceiptToMessage,
    optimisticUpdateChatList,
    updateMessageInCache,
    updateLastMessageInChatList,
} from "../../utils/message-cache-helper";
import { messagingQueryKeys } from "../messaging-query-keys";

interface MessageReadPayload {
    messageId: number;
    readerId: string;
    chatId: string;
    reader: { FullName: string; AvatarUrl: string | null };
    chatSetting: { IsArchived: boolean; IsRequested: boolean } | null;
}

interface ChatSettingUpdatedPayload extends ChatSetting {
    PreviousIsArchived: boolean;
    PreviousIsRequested: boolean;
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
    const router = useRouter();

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
            const isFromSelf = message.SenderId === currentProfileId;
            const settings = message?.Chat?.ChatSettings?.[0];

            if (!isFromSelf && !settings?.IsArchived && !settings?.IsRequested) {
                // Play sound only if not muted
                if (!settings?.IsMuted && audioRef.current) {
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(() => { });
                }
                // Always dispatch so NotificationHost can handle minimized unread count
                // even when muted — NotificationHost checks IsMuted before opening windows
                window.dispatchEvent(new CustomEvent("new-message-notification", { detail: message }));
            }

            appendMessageToChatCache(queryClient, message);
            optimisticUpdateChatList(queryClient, message);
        });

        socket.on("message-updated", (message: Message) => {
            updateMessageInCache(queryClient, message);
            updateLastMessageInChatList(queryClient, message);
        });

        socket.on("message-deleted", (message: Message) => {
            updateMessageInCache(queryClient, message);
            updateLastMessageInChatList(queryClient, message);
            queryClient.removeQueries({ queryKey: messagingQueryKeys.chatMediaAll(message.ChatId) });
        });

        socket.on("message-undeleted", (message: Message) => {
            updateMessageInCache(queryClient, message);
            updateLastMessageInChatList(queryClient, message);
            queryClient.removeQueries({ queryKey: messagingQueryKeys.chatMediaAll(message.ChatId) });
        });

        socket.on("message-read", (payload: MessageReadPayload) => {
            const receipt = {
                ReaderId: payload.readerId,
                ReadAt: new Date().toISOString(),
                Reader: payload.reader,
            };

            appendReadReceiptToMessage(queryClient, payload.chatId, payload.messageId, receipt);
            appendReadReceiptToChatListItem(queryClient, payload.chatId, payload.messageId, receipt, payload.chatSetting);
        });

        socket.on("chat-setting-updated", (payload: ChatSettingUpdatedPayload) => {
            const sourceTab = payload.PreviousIsArchived ? "archived" : payload.PreviousIsRequested ? "request" : "main";
            const targetTab = payload.IsArchived ? "archived" : payload.IsRequested ? "request" : "main";

            queryClient.invalidateQueries({ queryKey: messagingQueryKeys.chat(sourceTab) });
            queryClient.invalidateQueries({ queryKey: messagingQueryKeys.chatById(payload.ChatId) });
            if (sourceTab !== targetTab) {
                queryClient.invalidateQueries({ queryKey: messagingQueryKeys.chat(targetTab) });
                if (window.location.pathname.includes(payload.ChatId)) {
                    router.push("/messages");
                }
            }
        });

        socket.on("all-messages-deleted", (setting: ChatSetting) => {
            queryClient.removeQueries({ queryKey: messagingQueryKeys.messagesInsideChat(setting.ChatId) });
            queryClient.removeQueries({ queryKey: messagingQueryKeys.chatMediaAll(setting.ChatId) });

            const tab = setting.IsArchived ? "archived" : setting.IsRequested ? "request" : "main";
            queryClient.invalidateQueries({ queryKey: messagingQueryKeys.chat(tab) });

            if (window.location.pathname.includes(setting.ChatId)) {
                router.push("/messages");
            }
        });

        // Group events — invalidate relevant queries so UI stays in sync
        socket.on("group-updated", (payload: { ChatId?: string }) => {
            queryClient.invalidateQueries({ queryKey: ["messages", "chats"] });
            if (payload?.ChatId) {
                queryClient.invalidateQueries({ queryKey: messagingQueryKeys.chatById(payload.ChatId) });
            }
        });

        socket.on("member-added", (payload: { ChatId?: string }) => {
            queryClient.invalidateQueries({ queryKey: ["messages", "chats"] });
            queryClient.invalidateQueries({ queryKey: ["messages", "groupMembers"] });
            if (payload?.ChatId) {
                queryClient.invalidateQueries({ queryKey: messagingQueryKeys.chatById(payload.ChatId) });
            }
        });

        socket.on("member-removed", (payload: Record<string, unknown>) => {
            // Accept any casing the backend might send
            const chatId = (payload?.ChatId ?? payload?.chatId) as string | undefined;
            const removedId = (payload?.ProfileId ?? payload?.profileId ?? payload?.removedProfileId) as string | undefined;

            queryClient.invalidateQueries({ queryKey: ["messages", "chats"] });
            queryClient.invalidateQueries({ queryKey: ["messages", "groupMembers"] });
            queryClient.removeQueries({ queryKey: ["messages", "chatById"] });
            if (chatId) {
                queryClient.removeQueries({ queryKey: messagingQueryKeys.messagesInsideChat(chatId) });
            }

            // If the removed user is the current user, navigate away
            const isSelf = removedId === currentProfileId;
            if (isSelf && chatId && window.location.pathname.includes(chatId)) {
                router.push("/messages");
            }
        });

        socket.on("role-changed", (payload: { ChatId?: string }) => {
            queryClient.invalidateQueries({ queryKey: ["messages", "groupMembers"] });
            if (payload?.ChatId) {
                queryClient.invalidateQueries({ queryKey: messagingQueryKeys.chatById(payload.ChatId) });
            }
        });

        socket.on("ownership-transferred", (payload: { ChatId?: string }) => {
            queryClient.invalidateQueries({ queryKey: ["messages", "chats"] });
            queryClient.invalidateQueries({ queryKey: ["messages", "groupMembers"] });
            if (payload?.ChatId) {
                queryClient.invalidateQueries({ queryKey: messagingQueryKeys.chatById(payload.ChatId) });
            }
        });

        socket.on("profile-blocked", (payload: { OwnerId: string; BlockedProfileId: string }) => {
            if (currentProfileId === payload.OwnerId) {
                // I blocked them — refetch to get the new blockId
                queryClient.invalidateQueries({ queryKey: ["blockStatus", payload.BlockedProfileId] });
            } else if (currentProfileId === payload.BlockedProfileId) {
                // They blocked me — update cache directly since API won't reflect this
                queryClient.setQueryData(
                    ["blockStatus", payload.OwnerId],
                    (old: { iBlockedThem: boolean; blockId: string | null; theyBlockedMe: boolean } | undefined) =>
                        old ? { ...old, theyBlockedMe: true } : { iBlockedThem: false, blockId: null, theyBlockedMe: true }
                );
            }
        });

        socket.on("profile-unblocked", (payload: { OwnerId: string; BlockedProfileId: string }) => {
            if (currentProfileId === payload.OwnerId) {
                // I unblocked them — refetch
                queryClient.invalidateQueries({ queryKey: ["blockStatus", payload.BlockedProfileId] });
            } else if (currentProfileId === payload.BlockedProfileId) {
                // They unblocked me
                queryClient.setQueryData(
                    ["blockStatus", payload.OwnerId],
                    (old: { iBlockedThem: boolean; blockId: string | null; theyBlockedMe: boolean } | undefined) =>
                        old ? { ...old, theyBlockedMe: false } : { iBlockedThem: false, blockId: null, theyBlockedMe: false }
                );
            }
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
    }, [token, currentProfileId, queryClient, router]);

    return { isConnected, socketRef };
}
