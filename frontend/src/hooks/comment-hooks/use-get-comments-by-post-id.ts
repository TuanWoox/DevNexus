import { commentService } from "@/services/comment-service";
import { Page } from "@/types/common/page";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { commentQueryKeys } from "./use-comment-query-keys";

export const useGetCommentsByPostId = (postId: string, payload: Page<string>) => {
    return useQuery({
        queryKey: commentQueryKeys.byPost(postId, payload),
        queryFn: () => commentService.getCommentsByPostId(postId, payload),
        enabled: !!postId,
        placeholderData: keepPreviousData,
    });
};
