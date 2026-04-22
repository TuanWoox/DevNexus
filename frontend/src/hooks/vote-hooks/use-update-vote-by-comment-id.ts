import { voteService } from "@/services/vote-service";
import { VoteRequestDTO } from "@/types/vote/vote-request-dto";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commentQueryKeys } from "@/hooks/comment-hooks/use-comment-query-keys";

export const useUpdateVoteByCommentId = (commentId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (voteRequestDTO: VoteRequestDTO) => voteService.updateVoteByCommentId(commentId, voteRequestDTO),
        onSuccess: () => {
            // Khi vote comment thành công, refetch lại dữ liệu của comment đó
            queryClient.invalidateQueries({ queryKey: commentQueryKeys.detail(commentId) });
            // Hoặc refetch toàn bộ cây comment (nếu list có hiển thị số lượng vote)
            queryClient.invalidateQueries({ queryKey: commentQueryKeys.all });
        },
    });
};
