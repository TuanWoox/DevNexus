import { commentService } from "@/services/comment-service";
import { CreateCommentDTO } from "@/types/comment/create-comment-dto";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commentQueryKeys } from "./use-comment-query-keys";

export const useCreateComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (createCommentDTO: CreateCommentDTO) => commentService.createComment(createCommentDTO),
        onSuccess: (data) => {
            if (data.postId) {
                queryClient.invalidateQueries({ queryKey: commentQueryKeys.byPost(data.postId) });
            }
            if (data.answerId) {
                queryClient.invalidateQueries({ queryKey: commentQueryKeys.byAnswer(data.answerId) });
            }
            if (data.replyToCommentId) {
                queryClient.invalidateQueries({ queryKey: commentQueryKeys.replies(data.replyToCommentId) });
            }
            queryClient.invalidateQueries({ queryKey: commentQueryKeys.own() });
        },
    });
};