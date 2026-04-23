import { voteService } from "@/services/vote-service";
import { VoteRequestDTO } from "@/types/vote/vote-request-dto";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postQueryKeys } from "@/hooks/post-hooks/use-post-query-keys";
import { qaPostQueryKeys } from "../qa-post-hooks/use-qa-post-query-key";

export const useUpdateVoteByPostId = (postId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (voteRequestDTO: VoteRequestDTO) => voteService.updateVoteByPostId(postId, voteRequestDTO),
        onSuccess: (data) => {
            if (!data) return;
            queryClient.invalidateQueries({ queryKey: postQueryKeys.detail(postId) });
            queryClient.invalidateQueries({ queryKey: qaPostQueryKeys.detail(postId) });
            queryClient.invalidateQueries({ queryKey: postQueryKeys.lists() });
        },
    });
};
