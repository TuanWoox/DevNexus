import { commentService } from "@/services/comment-service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commentQueryKeys } from "./use-comment-query-keys";
import { answerQueryKeys } from "@/hooks/answer-hooks/use-answer-query-keys";
import { postQueryKeys } from "@/hooks/post-hooks/use-post-query-keys";

export const useDeleteComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (commentId: string) => commentService.deleteCommentById(commentId),
        onSuccess: (data) => {
            if (!data) return;
            queryClient.invalidateQueries({ queryKey: commentQueryKeys.all });
            queryClient.invalidateQueries({ queryKey: answerQueryKeys.all });
            queryClient.invalidateQueries({ queryKey: postQueryKeys.all });
        },
    });
};
