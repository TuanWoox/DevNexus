import { useInfiniteQuery } from "@tanstack/react-query";
import { historyService } from "@/services/history-service";
import { Page } from "@/types/common/page";
import { buildHistoryPayload, getNextHistoryPage } from "./use-history-pagination";
import { historyQueryKeys } from "./use-history-query-keys";

export const useGetCommentHistoryInfinite = (
    commentId: string,
    request: Omit<Page<string>, "pageNumber" | "size"> = {},
    enabled = true
) => {
    return useInfiniteQuery({
        queryKey: historyQueryKeys.commentHistory(commentId, request),
        queryFn: ({ pageParam = 0 }) =>
            historyService.getCommentHistory(commentId, buildHistoryPayload(request, pageParam as number)),
        initialPageParam: 0,
        getNextPageParam: getNextHistoryPage,
        enabled: enabled && !!commentId,
    });
};
