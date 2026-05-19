import { useInfiniteQuery } from "@tanstack/react-query";
import { historyService } from "@/services/history-service";
import { Page } from "@/types/common/page";
import { buildHistoryPayload, getNextHistoryPage } from "./use-history-pagination";
import { historyQueryKeys } from "./use-history-query-keys";

export const useGetQAPostHistoryInfinite = (
    qaPostId: string,
    request: Omit<Page<string>, "pageNumber" | "size"> = {},
    enabled = true
) => {
    return useInfiniteQuery({
        queryKey: historyQueryKeys.qaPostHistory(qaPostId, request),
        queryFn: ({ pageParam = 0 }) =>
            historyService.getQAPostHistory(qaPostId, buildHistoryPayload(request, pageParam as number)),
        initialPageParam: 0,
        getNextPageParam: getNextHistoryPage,
        enabled: enabled && !!qaPostId,
    });
};
