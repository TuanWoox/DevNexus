import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { Chat, InboxTab, Media, Message, PagedData, ReadReceipt } from "../types/contracts";
import type { ReturnResult } from "@/types/common/return-result";
import { messagingQueryKeys } from "../hooks/messaging-query-keys";

type MessagesPage = ReturnResult<PagedData<number, Message>>;
type MessagesInfiniteData = InfiniteData<MessagesPage>;

type ChatListPage = ReturnResult<PagedData<string, Chat>>;
type ChatListInfiniteData = InfiniteData<ChatListPage>;

type MediaPage = ReturnResult<PagedData<string, Media>>;
type MediaInfiniteData = InfiniteData<MediaPage>;

export function prependMessageToCache(
    oldData: MessagesInfiniteData | undefined,
    newMessage: Message
): MessagesInfiniteData | undefined {
    if (!oldData?.pages?.length) return oldData;

    // Skip if message already exists — handles sender receiving both API response and socket event
    const alreadyExists = oldData.pages.some(page =>
        page.result?.data?.some(m => m.Id === newMessage.Id)
    );
    if (alreadyExists) return oldData;

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
): void {
    const chatKey = messagingQueryKeys.messagesInsideChat(message.ChatId);
    queryClient.setQueryData<MessagesInfiniteData>(chatKey, (oldData) =>
        prependMessageToCache(oldData, message),
    );

    if (message.Medias?.length > 0) {
        optimisticPrependMedia(queryClient, message.ChatId, message.Medias);
    }
}

export function optimisticPrependMedia(
    queryClient: QueryClient,
    chatId: string,
    newMediaItems: Media[],
): void {
    if (!newMediaItems.length) return;

    // Update the specific-type cache key for each media type present, plus the "" (all) key
    const types = [...new Set(newMediaItems.map(m => m.Type)), "" as string];

    for (const mediaType of types) {
        const cacheKey = messagingQueryKeys.chatMedia(chatId, mediaType);
        const oldData = queryClient.getQueryData<MediaInfiniteData>(cacheKey);

        // User hasn't opened media panel for this type yet
        if (!oldData?.pages?.length) continue;

        const loadedPageCount = oldData.pages.length;
        const MEDIA_PAGE_SIZE = 30;

        const itemsForType = mediaType
            ? newMediaItems.filter(m => m.Type === mediaType)
            : newMediaItems;

        if (!itemsForType.length) continue;

        const allMedia: Media[] = oldData.pages.flatMap(p => p.result?.data ?? []);

        // Dedup by Media.Id
        const existingIds = new Set(allMedia.map(m => m.Id));
        const toInsert = itemsForType.filter(m => !existingIds.has(m.Id));

        if (!toInsert.length) continue;

        const combined = [...toInsert, ...allMedia];

        // Cut at loaded boundary — overflow served by server on next fetchNextPage
        const trimmed = combined.slice(0, loadedPageCount * MEDIA_PAGE_SIZE);

        const newPages = oldData.pages.map((page, pageIndex) => {
            const start = pageIndex * MEDIA_PAGE_SIZE;
            const pageData = trimmed.slice(start, start + MEDIA_PAGE_SIZE);
            return {
                ...page,
                result: page.result
                    ? { ...page.result, data: pageData }
                    : page.result,
            };
        });

        queryClient.setQueryData<MediaInfiniteData>(cacheKey, {
            ...oldData,
            pages: newPages,
        });
    }
}

const PAGE_SIZE = 30;

export function optimisticUpdateChatList(
    queryClient: QueryClient,
    message: Message,
): void {
    const chatSettings = message?.Chat?.ChatSettings?.[0];
    if (!chatSettings) return;

    let type: InboxTab = "main";
    if (chatSettings.IsArchived) {
        type = "archived";
    } else if (chatSettings.IsRequested) {
        type = "request";
    }

    const chatListKey = messagingQueryKeys.chat(type);
    const oldData = queryClient.getQueryData<ChatListInfiniteData>(chatListKey);

    // No cache yet — user hasn't opened this tab
    if (!oldData?.pages?.length) return;

    const loadedPageCount = oldData.pages.length;

    const updatedChat: Chat = {
        ...message.Chat,
        Messages: [message],
    };

    // Flatten all pages into one array
    const allChats: Chat[] = oldData.pages.flatMap(p => p.result?.data ?? []);

    // Remove the chat if it already exists (will re-insert at correct position)
    const existingIndex = allChats.findIndex(c => c.Id === message.ChatId);
    if (existingIndex !== -1) {
        allChats.splice(existingIndex, 1);
    }

    // Insert at correct position
    if (type === "main") {
        const pinnedIndex = allChats.findIndex(c => c.ChatSettings?.[0]?.IsPinned);
        if (pinnedIndex !== -1) {
            allChats.splice(pinnedIndex + 1, 0, updatedChat);
        } else {
            allChats.unshift(updatedChat);
        }
    } else {
        allChats.unshift(updatedChat);
    }

    // Cut at loaded boundary — overflow will be served by server on next fetchNextPage
    const maxItems = loadedPageCount * PAGE_SIZE;
    const trimmedChats = allChats.slice(0, maxItems);

    // Redistribute back into the same number of pages
    const newPages = oldData.pages.map((page, pageIndex) => {
        const start = pageIndex * PAGE_SIZE;
        const pageChats = trimmedChats.slice(start, start + PAGE_SIZE);
        return {
            ...page,
            result: page.result
                ? { ...page.result, data: pageChats }
                : page.result,
        };
    });

    queryClient.setQueryData<ChatListInfiniteData>(chatListKey, {
        ...oldData,
        pages: newPages,
    });
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
    receipt: { ReaderId: string; ReadAt: string; Reader?: { FullName: string; AvatarUrl: string | null } },
    chatSetting?: { IsArchived: boolean; IsRequested: boolean } | null
): void {
    let tabTypes: string[];
    if (chatSetting !== undefined) {
        if (chatSetting?.IsArchived) tabTypes = ["archived"];
        else if (chatSetting?.IsRequested) tabTypes = ["request"];
        else tabTypes = ["main"];
    } else {
        tabTypes = ["main", "request", "archived"];
    }
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
