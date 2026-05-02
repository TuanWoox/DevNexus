import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { Chat, InboxTab, Message, PagedData, ReadReceipt } from "../types/contracts";
import type { ReturnResult } from "@/types/common/return-result";
import { messagingQueryKeys } from "../hooks/messaging-query-keys";

type MessagesPage = ReturnResult<PagedData<number, Message>>;
type MessagesInfiniteData = InfiniteData<MessagesPage>;

type ChatListPage = ReturnResult<PagedData<string, Chat>>;
type ChatListInfiniteData = InfiniteData<ChatListPage>;

export function prependMessageToCache(
    oldData: MessagesInfiniteData | undefined,
    newMessage: Message
): MessagesInfiniteData | undefined {
    if (!oldData?.pages?.length) return oldData;

    const pages = oldData.pages.map((page, i) => {
        if (i !== 0 || !page.result) return page;
        return {
            ...page,
            result: {
                ...page.result,
                data: [newMessage, ...page.result.data],
            },
        };
    });

    return { ...oldData, pages };
}

export function appendMessageToChatCache(
    queryClient: QueryClient,
    message: Message,
    fromOwnCreate: boolean = false
): void {
    const chatKey = messagingQueryKeys.messagesInsideChat(message.ChatId);
    queryClient.setQueryData<MessagesInfiniteData>(chatKey, (oldData) =>
        prependMessageToCache(oldData, message),
    );

    const chatSettings = message?.Chat?.ChatSettings?.[0];
    let type: InboxTab = "main";
    if (chatSettings?.IsArchived) {
        type = "archived";
    } else if (chatSettings?.IsRequested) {
        type = "request";
    }

    // Invalidate media cache if the message has media attachments
    if (message.Medias?.length > 0) {
        queryClient.invalidateQueries({
            queryKey: messagingQueryKeys.chatMediaAll(message.ChatId),
        });
    }

    invalidateAllChats(queryClient, type, fromOwnCreate);
}

//Can optimized later, but row we just use it for demo as soon as possible
export function invalidateAllChats(queryClient: QueryClient, type: InboxTab, fromOwnCreate: boolean = true): void {
    //fromOwnCreate = true mean we receive message from other people, if false we create and then append
    if (!fromOwnCreate) queryClient.invalidateQueries({ queryKey: ["messages", "chats"] });
    else {
        queryClient.invalidateQueries({ queryKey: ["messages", "chats", type] });
        const arrayOfType = ["main", "archived", "requested"].filter(x => x.toLowerCase() !== type.toLowerCase());
        arrayOfType.map(x => {
            queryClient.removeQueries({ queryKey: ["messages", "chats", x] })
        })
    }
}

export function appendReadReceiptToMessage(
    queryClient: QueryClient,
    chatId: string,
    messageId: number,
    receipt: { ReaderId: string; ReadAt: string; Reader?: { FullName: string; AvatarUrl: string | null } }
): void {
    const chatKey = messagingQueryKeys.messagesInsideChat(chatId);
    const oldData = queryClient.getQueryData<MessagesInfiniteData>(chatKey);
    if (!oldData?.pages?.length) return;

    let changed = false;
    const pages = oldData.pages.map((page) => {
        if (!page.result) return page;
        const data = page.result.data as Message[];
        let pageChanged = false;
        const updated = data.map((msg) => {
            if (msg.Id !== messageId) return msg;
            const existing = msg.ReadReceipts ?? [];
            if (existing.some((r) => r.ReaderId === receipt.ReaderId)) return msg;
            pageChanged = true;
            const newReceipt: ReadReceipt = {
                MessageId: messageId,
                ReaderId: receipt.ReaderId,
                ReadAt: receipt.ReadAt,
                Reader: receipt.Reader,
            };
            return { ...msg, ReadReceipts: [...existing, newReceipt] };
        });
        if (!pageChanged) return page;
        changed = true;
        return { ...page, result: { ...page.result, data: updated } };
    });

    if (changed) {
        queryClient.setQueryData<MessagesInfiniteData>(chatKey, { ...oldData, pages });
    }
}

export function appendReadReceiptToChatListItem(
    queryClient: QueryClient,
    chatId: string,
    messageId: number,
    receipt: { ReaderId: string; ReadAt: string; Reader?: { FullName: string; AvatarUrl: string | null } }
): void {
    console.log(messageId);
    const tabTypes: string[] = ["main", "request", "archived"];
    for (const type of tabTypes) {
        const chatListKey = messagingQueryKeys.chat(type);
        const oldData = queryClient.getQueryData<ChatListInfiniteData>(chatListKey);
        if (!oldData?.pages?.length) continue;

        let changed = false;
        const pages = oldData.pages.map((page) => {
            if (!page.result) return page;
            const chats = page.result.data;
            const updated = chats.map((chat) => {
                if (chat.Id !== chatId) return chat;
                const latestMessage = chat.Messages?.[0];
                if (!latestMessage || latestMessage.Id !== messageId) return chat;
                const existing = latestMessage.ReadReceipts ?? [];
                if (existing.some((r) => r.ReaderId === receipt.ReaderId)) return chat;
                changed = true;
                const newReceipt: ReadReceipt = {
                    MessageId: messageId,
                    ReaderId: receipt.ReaderId,
                    ReadAt: receipt.ReadAt,
                    Reader: receipt.Reader,
                };
                return {
                    ...chat,
                    Messages: [{
                        ...latestMessage,
                        ReadReceipts: [...existing, newReceipt],
                    }],
                };
            });
            if (!changed) return page;
            return { ...page, result: { ...page.result, data: updated } };
        });

        if (changed) {
            queryClient.setQueryData<ChatListInfiniteData>(chatListKey, { ...oldData, pages });
        }
    }
}
