import { commentService } from "@/services/comment-service";
import { CreateCommentDTO } from "@/types/comment/create-comment-dto";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commentQueryKeys } from "./use-comment-query-keys";
import { answerQueryKeys } from "../answer-hooks/use-answer-query-keys";
import { qaPostQueryKeys } from "../qa-post-hooks/use-qa-post-query-key";
import { postQueryKeys } from "../post-hooks/use-post-query-keys";

export const useCreateComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (createCommentDTO: CreateCommentDTO) => commentService.createComment(createCommentDTO),
        onSuccess: (data) => {
            if (!data) return;
            if (data.postId) {
                queryClient.invalidateQueries({ queryKey: commentQueryKeys.byPost(data.postId) });
                queryClient.invalidateQueries({ queryKey: postQueryKeys.detail(data.postId) });
            }
            if (data.answerId) {
                queryClient.invalidateQueries({ queryKey: commentQueryKeys.byAnswer(data.answerId) });
                // Invalidate all answers queries để buộc danh sách answer (và các replies lồng bên trong) được tải mới
                queryClient.invalidateQueries({ queryKey: answerQueryKeys.all });
            }
            if (data.replyToCommentId) {
                queryClient.invalidateQueries({ queryKey: commentQueryKeys.replies(data.replyToCommentId) });
            }
            queryClient.invalidateQueries({ queryKey: commentQueryKeys.own() });
        },
    });
};
