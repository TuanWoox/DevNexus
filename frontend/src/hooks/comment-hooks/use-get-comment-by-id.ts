import { commentService } from "@/services/comment-service";
import { useQuery } from "@tanstack/react-query";
import { commentQueryKeys } from "./use-comment-query-keys";

export const useGetCommentById = (commentId: string) => {
    return useQuery({
        queryKey: commentQueryKeys.detail(commentId),
        queryFn: () => commentService.getCommentById(commentId),
        enabled: !!commentId,
    });
};
