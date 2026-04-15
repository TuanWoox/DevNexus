import { commentService } from "@/services/comment-service";
import { Page } from "@/types/common/page";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { commentQueryKeys } from "./use-comment-query-keys";

export const useGetCommentsByAnswerId = (answerId: string, payload: Page<string>) => {
    return useQuery({
        queryKey: commentQueryKeys.byAnswer(answerId, payload),
        queryFn: () => commentService.getCommentsByAnswerId(answerId, payload),
        enabled: !!answerId,
        placeholderData: keepPreviousData,
    });
};
