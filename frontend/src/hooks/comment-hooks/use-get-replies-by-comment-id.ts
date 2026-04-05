import { commentService } from "@/services/comment-service";
import { Page } from "@/types/common/page";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { commentQueryKeys } from "./use-comment-query-keys";

export const useGetRepliesByCommentId = (commentId: string, payload: Page<string>) => {
    return useQuery({
        queryKey: commentQueryKeys.replies(commentId, payload),
        queryFn: () => commentService.getRepliesByCommentId(commentId, payload),
        enabled: !!commentId,
        placeholderData: keepPreviousData,
    });
};
