import { voteService } from "@/services/vote-service";
import { VoteRequestDTO } from "@/types/vote/vote-request-dto";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commentQueryKeys } from "@/hooks/comment-hooks/use-comment-query-keys";

export const useUpdateVoteByCommentId = (commentId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (voteRequestDTO: VoteRequestDTO) => voteService.updateVoteByCommentId(commentId, voteRequestDTO),
        onSuccess: (data) => {
            if (!data) return;
            queryClient.invalidateQueries({ queryKey: commentQueryKeys.detail(commentId) });
            queryClient.invalidateQueries({ queryKey: commentQueryKeys.all });
        },
    });
};
