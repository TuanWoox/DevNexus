import { useInfiniteQuery } from "@tanstack/react-query";
import { messageService } from "@/features/messages/services/message-service";
import { messagingQueryKeys } from "../messaging-query-keys";
import { Media } from "@/features/messages/types/contracts";

export function useChatMedia(chatId: string, mediaType: string) {
    return useInfiniteQuery({
        queryKey: messagingQueryKeys.chatMedia(chatId, mediaType),
        queryFn: async ({ pageParam = 1 }) => {
            const page = {
                size: 30,
                pageNumber: pageParam as number,
                totalElements: 0,
                selected: mediaType ? [mediaType] as string[] : [],
                indexPaging: undefined,
            };
            return messageService.getChatMedia(chatId, page);
        },
        getNextPageParam: (lastPage) => {
            if (!lastPage?.result) return undefined;
            const { page } = lastPage.result;
            const totalElements = page.totalElements ?? 0;
            const pageNumber = page.pageNumber ?? 0;
            const totalPages = Math.ceil(totalElements / page.size);
            const nextPage = pageNumber + 1;
            return nextPage <= totalPages ? nextPage : undefined;
        },
        initialPageParam: 1,
        enabled: !!chatId,
        staleTime: 60_000,
    });
}

export function useChatMediaFlat(chatId: string, mediaType: string) {
    const query = useChatMedia(chatId, mediaType);
    const media = query.data?.pages?.flatMap(
        (p) => p?.result?.data ?? []
    ) as Media[];

    return {
        media,
        isLoading: query.isLoading,
        isFetchingMore: query.isFetchingNextPage,
        hasMore: query.hasNextPage ?? false,
        loadMore: () => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
                query.fetchNextPage();
            }
        },
    };
}
