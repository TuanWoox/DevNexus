import { commentService } from "@/services/comment-service";
import { UpdateCommentDTO } from "@/types/comment/update-comment-dto";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commentQueryKeys } from "./use-comment-query-keys";

export const useUpdateComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (updateCommentDTO: UpdateCommentDTO) => commentService.updateComment(updateCommentDTO),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: commentQueryKeys.detail(data.id) });
            queryClient.invalidateQueries({ queryKey: commentQueryKeys.all });
        },
    });
};
