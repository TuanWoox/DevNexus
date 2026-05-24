import { commentService } from "@/services/comment-service";
import { UpdateCommentDTO } from "@/types/comment/update-comment-dto";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commentQueryKeys } from "./use-comment-query-keys";
import { answerQueryKeys } from "@/hooks/answer-hooks/use-answer-query-keys";
import { qaPostQueryKeys } from "@/hooks/qa-post-hooks/use-qa-post-query-key";
import { postQueryKeys } from "@/hooks/post-hooks/use-post-query-keys";

export const useUpdateComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (updateCommentDTO: UpdateCommentDTO) => commentService.updateComment(updateCommentDTO),
        onSuccess: (data) => {
            if (!data) return;
            queryClient.invalidateQueries({ queryKey: commentQueryKeys.detail(data.id) });
            queryClient.invalidateQueries({ queryKey: commentQueryKeys.all });
            
            if (data.answerId) {
                queryClient.invalidateQueries({ queryKey: answerQueryKeys.all });
                queryClient.invalidateQueries({ queryKey: qaPostQueryKeys.all });
            }
            if (data.postId) {
                queryClient.invalidateQueries({ queryKey: postQueryKeys.detail(data.postId) });
            }
        },
    });
};
