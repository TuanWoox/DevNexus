import { voteService } from "@/services/vote-service";
import { VoteRequestDTO } from "@/types/vote/vote-request-dto";
import { SelectCommentDTO } from "@/types/comment/select-comment-dto";
import { PagedData } from "@/types/common/paged-data";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commentQueryKeys } from "@/hooks/comment-hooks/use-comment-query-keys";

const applyVoteToComment = (comment: SelectCommentDTO, voteRequestDTO: VoteRequestDTO): SelectCommentDTO => {
    const isToggleOff = comment.currentUserVote === voteRequestDTO.isUpvote;
    let newUpvoteCount = comment.upvoteCount;
    let newDownvoteCount = comment.downvoteCount;
    let newCurrentUserVote: boolean | null;

    if (isToggleOff) {
        if (voteRequestDTO.isUpvote) newUpvoteCount -= 1;
        else newDownvoteCount -= 1;
        newCurrentUserVote = null;
    } else if (comment.currentUserVote == null) {
        if (voteRequestDTO.isUpvote) newUpvoteCount += 1;
        else newDownvoteCount += 1;
        newCurrentUserVote = voteRequestDTO.isUpvote;
    } else {
        if (voteRequestDTO.isUpvote) { newUpvoteCount += 1; newDownvoteCount -= 1; }
        else { newDownvoteCount += 1; newUpvoteCount -= 1; }
        newCurrentUserVote = voteRequestDTO.isUpvote;
    }

    return {
        ...comment,
        currentUserVote: newCurrentUserVote,
        upvoteCount: Math.max(0, newUpvoteCount),
        downvoteCount: Math.max(0, newDownvoteCount),
    };
};

// All comment list queries return PagedData, not a plain array
const applyVoteToPagedComments = (
    old: PagedData<SelectCommentDTO, string> | undefined,
    commentId: string,
    voteRequestDTO: VoteRequestDTO
): PagedData<SelectCommentDTO, string> | undefined => {
    if (!old) return old;
    return {
        ...old,
        data: old.data.map((comment) =>
            comment.id === commentId ? applyVoteToComment(comment, voteRequestDTO) : comment
        ),
    };
};

export const useUpdateVoteByCommentId = (commentId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (voteRequestDTO: VoteRequestDTO) => voteService.updateVoteByCommentId(commentId, voteRequestDTO),

        onMutate: async (voteRequestDTO) => {
            await queryClient.cancelQueries({ queryKey: commentQueryKeys.all });

            const previousDetail = queryClient.getQueryData<SelectCommentDTO>(commentQueryKeys.detail(commentId));
            const previousLists = queryClient.getQueriesData<PagedData<SelectCommentDTO, string>>({ queryKey: commentQueryKeys.all });

            if (previousDetail) {
                queryClient.setQueryData(commentQueryKeys.detail(commentId), applyVoteToComment(previousDetail, voteRequestDTO));
            }

            queryClient.setQueriesData<PagedData<SelectCommentDTO, string>>(
                {
                    queryKey: commentQueryKeys.all,
                    // Exclude 'detail' entries — they hold SelectCommentDTO, not PagedData.
                    // detail keys have the shape: ['comments', 'detail', id]
                    predicate: (query) => {
                        const key = query.queryKey as string[];
                        return key[1] !== 'detail';
                    },
                },
                (old) => applyVoteToPagedComments(old, commentId, voteRequestDTO)
            );

            return { previousDetail, previousLists };
        },

        onError: (_error, _variables, context) => {
            if (context?.previousDetail) {
                queryClient.setQueryData(commentQueryKeys.detail(commentId), context.previousDetail);
            }
            context?.previousLists?.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data);
            });
        },

        // onSuccess: intentionally empty — onMutate already patched RAM via setQueryData/setQueriesData.
        // Zero-refetch pattern: no invalidateQueries here.
    });
};
