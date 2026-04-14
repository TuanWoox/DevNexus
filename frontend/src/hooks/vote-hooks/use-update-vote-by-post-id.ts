import { voteService } from "@/services/vote-service";
import { VoteRequestDTO } from "@/types/vote/vote-request-dto";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postQueryKeys } from "@/hooks/post-hooks/use-post-query-keys";
import { qaPostQueryKeys } from "../qa-post-hooks/use-qa-post-query-key";
import { answerQueryKeys } from "../answer-hooks/use-answer-query-keys";

export const useUpdateVoteByPostId = (postId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (voteRequestDTO: VoteRequestDTO) => voteService.updateVoteByPostId(postId, voteRequestDTO),
        onSuccess: () => {
            // Khi vote thành công, cần invalidate post detail để cập nhật số lượng vote
            queryClient.invalidateQueries({ queryKey: postQueryKeys.detail(postId) });
            queryClient.invalidateQueries({ queryKey: qaPostQueryKeys.detail(postId) });
            // Đồng thời cũng nên làm mới danh sách bài viết nếu trên danh sách có hiển thị điểm vote
            queryClient.invalidateQueries({ queryKey: postQueryKeys.lists() });
            queryClient.invalidateQueries({ queryKey: answerQueryKeys.lists() });
        },
    });
};
