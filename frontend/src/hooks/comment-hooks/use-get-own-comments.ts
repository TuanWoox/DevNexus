import { commentService } from "@/services/comment-service";
import { Page } from "@/types/common/page";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { commentQueryKeys } from "./use-comment-query-keys";

// API: GET /api/Comments/my-comments
export const useGetOwnComments = (payload: Page<string>) => {
    return useQuery({
        queryKey: commentQueryKeys.own(payload),
        queryFn: () => commentService.getOwnComments(payload),
        placeholderData: keepPreviousData,
    });
};
