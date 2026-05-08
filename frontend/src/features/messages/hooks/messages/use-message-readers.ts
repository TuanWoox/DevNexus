import { useInfiniteQuery } from "@tanstack/react-query";
import { messagingQueryKeys } from "../messaging-query-keys";
import { messageService } from "@/features/messages/services/message-service";
import type { ReadReceipt } from "@/features/messages/types/contracts";
import { Page } from "@/types/common/page";
import { useMemo } from "react";

export const useMessageReaders = (messageId: number, size: number = 20) => {
    const query = useInfiniteQuery({
        queryKey: messagingQueryKeys.messageReaders(messageId),
        queryFn: ({ pageParam = 1 }) => {
            const page: Page<number> = { pageNumber: pageParam, size };
            return messageService.getMessageReaders(messageId, page);
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const result = lastPage?.result;
            if (!result) return undefined;
            const { page, data } = result as { page: { pageNumber: number; size: number; totalElements?: number }; data: ReadReceipt[] };
            if (!data || data.length < page.size) return undefined;
            return page.pageNumber + 1;
        },
        enabled: !!messageId,
    });

    const readers = useMemo(() => {
        const all = query.data?.pages?.flatMap((p) => p?.result?.data ?? []) ?? [];
        const deduped = new Map(all.map((r) => [r.ReaderId, r]));
        return Array.from(deduped.values());
    }, [query.data?.pages]);

    return {
        readers,
        isLoading: query.isLoading,
        hasMore: query.hasNextPage,
        loadMore: query.fetchNextPage,
        isFetchingMore: query.isFetchingNextPage,
    };
};
