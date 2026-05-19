import { useInfiniteQuery } from "@tanstack/react-query";
import { historyService } from "@/services/history-service";
import { Page } from "@/types/common/page";
import { buildHistoryPayload, getNextHistoryPage } from "./use-history-pagination";
import { historyQueryKeys } from "./use-history-query-keys";

export const useGetAnswerHistoryInfinite = (
    answerId: string,
    request: Omit<Page<string>, "pageNumber" | "size"> = {},
    enabled = true
) => {
    return useInfiniteQuery({
        queryKey: historyQueryKeys.answerHistory(answerId, request),
        queryFn: ({ pageParam = 0 }) =>
            historyService.getAnswerHistory(answerId, buildHistoryPayload(request, pageParam as number)),
        initialPageParam: 0,
        getNextPageParam: getNextHistoryPage,
        enabled: enabled && !!answerId,
    });
};
