import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { messagingQueryKeys } from "../messaging-query-keys";
import { Page } from "@/types/common/page";
import { messageService } from "../../services/message-service";
import { Message } from "../../types/contracts";

export const useMessageList = (chatId: string, size: number = 20) => {
    const query = useInfiniteQuery({
        queryKey: messagingQueryKeys.messagesInsideChat(chatId),
        queryFn: ({ pageParam }) => {
            const page: Page<number> = {
                indexPaging: pageParam,
                size,
            };
            return messageService.getMessagesPaging(chatId, page);
        },
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => {
            const result = lastPage?.result;
            if (!result) return undefined;
            const { data } = result as { data: unknown[] };
            if (!data.length || data.length < size) return undefined;
            const lastMessage = data[data.length - 1] as Message;
            return lastMessage.Id;
        },
        enabled: !!chatId,
    });

    const messages = useMemo(() => {
        const all = query.data?.pages?.flatMap((p) => p?.result?.data ?? []) ?? [];
        const deduped = new Map(all.map((m) => [m.Id, m]));
        return Array.from(deduped.values()).sort((a, b) => b.Id - a.Id);
    }, [query.data?.pages]);

    return {
        messages,
        isLoading: query.isLoading,
        isFetchingMore: query.isFetchingNextPage,
        hasMore: query.hasNextPage ?? false,
        loadMore: () => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
                query.fetchNextPage();
            }
        },
        query,
    };
};
