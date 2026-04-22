import { commentService } from "@/services/comment-service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commentQueryKeys } from "./use-comment-query-keys";

export const useDeleteComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (commentId: string) => commentService.deleteCommentById(commentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: commentQueryKeys.all });
        },
    });
};
