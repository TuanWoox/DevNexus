import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { InboxTab, Message, PagedData } from "../types/contracts";
import type { ReturnResult } from "@/types/common/return-result";
import { messagingQueryKeys } from "../hooks/messaging-query-keys";

type MessagesPage = ReturnResult<PagedData<number, Message>>;
type MessagesInfiniteData = InfiniteData<MessagesPage>;

export function prependMessageToCache(
    oldData: MessagesInfiniteData | undefined,
    newMessage: Message,
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

    invalidateAllChats(queryClient, type);
}

//Can optimized later, but row we just use it for demo as soon as possible
export function invalidateAllChats(queryClient: QueryClient, type: InboxTab): void {
    queryClient.invalidateQueries({ queryKey: ["messages", "chats", type] });
    const arrayOfType = ["main", "archived", "requested"].filter(x => x.toLowerCase() == type.toLowerCase());
    arrayOfType.map(x => {
        queryClient.removeQueries({ queryKey: ["messages", "chats", x] })
    })
}

//Can optimized later, but row we just use it for demo as soon as possible
export function invalidateAllMessagesInsideChat(queryClient: QueryClient, chatId: string = ""): void {
    queryClient.invalidateQueries({ queryKey: ["messages", "messagesInsideChat", chatId] });
}
