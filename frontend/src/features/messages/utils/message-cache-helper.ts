import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { Message, PagedData } from "../types/contracts";
import type { ReturnResult } from "@/types/common/return-result";

type MessagesPage = ReturnResult<PagedData<number, Message>>;
type MessagesInfiniteData = InfiniteData<MessagesPage>;

//Already optimized and good to go
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

//Can optimized later, but row we just use it for demo as soon as possible
export function invalidateInbox(queryClient: QueryClient): void {
    queryClient.invalidateQueries({ queryKey: ["messages", "inbox"] });
}
//Can optimized later, but row we just use it for demo as soon as possible
export function invalidateAllChats(queryClient: QueryClient): void {
    queryClient.invalidateQueries({ queryKey: ["messages", "chat"] });
}
