import { Page } from "@/types/common/page";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { qaPostQueryKeys } from "./use-qa-post-query-key";
import { qaPostService } from "@/services/qa-post-service";

export const useGetQAPostsWithPagination = (payload: Page<string>) => {
    return useQuery({
        queryKey: qaPostQueryKeys.list(payload),
        queryFn: () => qaPostService.getQAPostWithPagination(payload),
        placeholderData: keepPreviousData,
    });
};
