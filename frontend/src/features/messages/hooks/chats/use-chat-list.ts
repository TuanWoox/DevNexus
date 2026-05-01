import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { messagingQueryKeys } from "../messaging-query-keys";
import { chatService } from "../../services/chat-service";
import { Page } from "@/types/common/page";
import { Chat } from "../../types/contracts";

export const useChatList = (size: number = 20, type: string) => {
    const query = useInfiniteQuery({
        queryKey: messagingQueryKeys.chat(type),
        queryFn: ({ pageParam = 1 }) => {
            const page: Page<string> = { pageNumber: pageParam, size };
            return chatService.getChatPaging(page, type);
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const result = lastPage?.result;
            if (!result) return undefined;
            const { page, data } = result as { page: { pageNumber: number; size: number }; data: Chat[] };
            if (!data || data.length < page.size) return undefined;
            return page.pageNumber + 1;
        },
    });

    const chats = useMemo(() => {
        return query.data?.pages?.flatMap((p) => p?.result?.data ?? []) ?? [];
    }, [query.data?.pages]);

    return {
        chats,
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
