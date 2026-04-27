"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { toast } from "sonner";
import { messageServiceAdapter } from "@/features/messages/services/message-service-adapter";
import { messagingQueryKeys } from "@/features/messages/hooks/messaging-query-keys";
import {
    ChatDetailData,
    ChatListItem,
    CreateMessageDto,
    Message,
    MessageReadEvent,
    MessageReadReceipt,
    PagedData,
    ReturnResult,
    UpdateChatSettingDTO,
} from "@/features/messages/types/contracts";

function getProfileId(rawProfileId?: string): string {
    return rawProfileId || "mock-self";
}

export type InboxTab = "main" | "request" | "archived";

export function useMessagingInbox() {
    const profileId = useSelector((state: RootState) => getProfileId(state.auth.user?.profileId));

    return useQuery({
        queryKey: messagingQueryKeys.inbox(profileId),
        queryFn: () => messageServiceAdapter.getChatsPaging(profileId),
    });
}

export function useFilteredInbox(tab: InboxTab) {
    const inboxQuery = useMessagingInbox();

    const items = useMemo(() => {
        const source = inboxQuery.data?.Result?.data ?? [];

        if (tab === "request") {
            return source.filter((item) => item.CurrentSetting.IsRequested);
        }

        if (tab === "archived") {
            return source.filter((item) => item.CurrentSetting.IsArchived);
        }

        return source.filter(
            (item) => !item.CurrentSetting.IsArchived && !item.CurrentSetting.IsRequested,
        );
    }, [inboxQuery.data?.Result?.data, tab]);

    return {
        ...inboxQuery,
        items,
    };
}

export function useMessagingChat(chatId: string) {
    const profileId = useSelector((state: RootState) => getProfileId(state.auth.user?.profileId));

    return useQuery({
        queryKey: messagingQueryKeys.chat(profileId, chatId),
        queryFn: () => messageServiceAdapter.getMessagesPaging(chatId, profileId),
        enabled: Boolean(chatId),
    });
}

export function useUpdateChatSetting() {
    const profileId = useSelector((state: RootState) => getProfileId(state.auth.user?.profileId));
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UpdateChatSettingDTO) =>
            messageServiceAdapter.updateChatSetting(payload, profileId),
        onSuccess: (result) => {
            if (result.Message) {
                toast.error(result.Message);
                return;
            }

            queryClient.invalidateQueries({ queryKey: messagingQueryKeys.inbox(profileId) });
            queryClient.invalidateQueries({ queryKey: messagingQueryKeys.all });
        },
    });
}

export function useClearChatMessages() {
    const profileId = useSelector((state: RootState) => getProfileId(state.auth.user?.profileId));
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (chatSettingId: string) => messageServiceAdapter.clearMessages(chatSettingId, profileId),
        onSuccess: (result) => {
            if (result.Message) {
                toast.error(result.Message);
            } else {
                toast.success("Messages cleared in this chat");
            }

            queryClient.invalidateQueries({ queryKey: messagingQueryKeys.inbox(profileId) });
            queryClient.invalidateQueries({ queryKey: messagingQueryKeys.all });
        },
    });
}

type SendContext = {
    previousChatData?: ReturnResult<PagedData<number, ChatDetailData>>;
    previousInboxData?: ReturnResult<PagedData<string, ChatListItem>>;
};

export function useSendMessage(chatId: string) {
    const profileId = useSelector((state: RootState) => getProfileId(state.auth.user?.profileId));
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: Omit<CreateMessageDto, "ChatId">) =>
            messageServiceAdapter.sendMessage({ ...payload, ChatId: chatId }, profileId),
        onMutate: async (payload): Promise<SendContext> => {
            const temporaryId = Date.now() * -1;

            await queryClient.cancelQueries({ queryKey: messagingQueryKeys.chat(profileId, chatId) });

            const previousChatData = queryClient.getQueryData<ReturnResult<PagedData<number, ChatDetailData>>>(
                messagingQueryKeys.chat(profileId, chatId),
            );
            const previousInboxData = queryClient.getQueryData<ReturnResult<PagedData<string, ChatListItem>>>(
                messagingQueryKeys.inbox(profileId),
            );

            if (previousChatData?.Result?.data?.[0]) {
                const detail = previousChatData.Result.data[0];
                const optimisticMessage: Message = {
                    Id: temporaryId,
                    Content: payload.Content,
                    SenderId: profileId,
                    ChatId: chatId,
                    DateCreated: new Date().toISOString(),
                    DateModified: new Date().toISOString(),
                };

                queryClient.setQueryData<ReturnResult<PagedData<number, ChatDetailData>>>(
                    messagingQueryKeys.chat(profileId, chatId),
                    {
                        ...previousChatData,
                        Result: {
                            ...previousChatData.Result,
                            data: [
                                {
                                    ...detail,
                                    Messages: [...detail.Messages, optimisticMessage],
                                },
                            ],
                        },
                    },
                );
            }

            return {
                previousChatData,
                previousInboxData,
            };
        },
        onError: (_error, _variables, context) => {
            if (context?.previousChatData) {
                queryClient.setQueryData(messagingQueryKeys.chat(profileId, chatId), context.previousChatData);
            }
            if (context?.previousInboxData) {
                queryClient.setQueryData(messagingQueryKeys.inbox(profileId), context.previousInboxData);
            }
            toast.error("Failed to send message");
        },
        onSuccess: (result) => {
            if (result.Message) {
                toast.error(result.Message);
                return;
            }

            queryClient.invalidateQueries({ queryKey: messagingQueryKeys.chat(profileId, chatId) });
            queryClient.invalidateQueries({ queryKey: messagingQueryKeys.inbox(profileId) });
        },
    });
}

export function useMarkChatAsRead(chatId: string) {
    const profileId = useSelector((state: RootState) => getProfileId(state.auth.user?.profileId));
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (): Promise<MessageReadReceipt[]> => {
            const detailData = queryClient.getQueryData<ReturnResult<PagedData<number, ChatDetailData>>>(
                messagingQueryKeys.chat(profileId, chatId),
            );

            const detail = detailData?.Result?.data?.[0];
            if (!detail) {
                return [];
            }

            const unreadMessages = detail.Messages.filter((message) => {
                if (message.SenderId === profileId) {
                    return false;
                }

                return !detail.Receipts.some(
                    (receipt) => receipt.MessageId === message.Id && receipt.ReaderId === profileId,
                );
            });

            const marked: MessageReadReceipt[] = [];
            for (const message of unreadMessages) {
                const result = await messageServiceAdapter.markMessageRead(message.Id, profileId);
                if (!result.Message && result.Result !== null) {
                    marked.push(result.Result);
                }
            }

            return marked;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: messagingQueryKeys.chat(profileId, chatId) });
            queryClient.invalidateQueries({ queryKey: messagingQueryKeys.inbox(profileId) });
        },
    });
}

export function useMessagingRealtimeBoundary() {
    const profileId = useSelector((state: RootState) => getProfileId(state.auth.user?.profileId));
    const queryClient = useQueryClient();

    const handleNewMessage = async (payload: Message) => {
        await messageServiceAdapter.onIncomingNewMessage(payload, profileId);
        queryClient.invalidateQueries({ queryKey: messagingQueryKeys.all });
    };

    const handleMessageRead = async (payload: MessageReadEvent) => {
        await messageServiceAdapter.onIncomingMessageRead(payload, profileId);
        queryClient.invalidateQueries({ queryKey: messagingQueryKeys.all });
    };

    return {
        handleNewMessage,
        handleMessageRead,
    };
}
