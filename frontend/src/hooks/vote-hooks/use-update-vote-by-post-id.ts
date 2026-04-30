import { voteService } from "@/services/vote-service";
import { VoteRequestDTO } from "@/types/vote/vote-request-dto";
import { SelectPostDTO } from "@/types/post/select-post-dto";
import { PagedData } from "@/types/common/paged-data";
import { useMutation, useQueryClient, InfiniteData } from "@tanstack/react-query";
import { postQueryKeys } from "@/hooks/post-hooks/use-post-query-keys";
import { qaPostQueryKeys } from "../qa-post-hooks/use-qa-post-query-key";

const applyVoteToPost = (post: SelectPostDTO, voteRequestDTO: VoteRequestDTO): SelectPostDTO => {
    const isToggleOff = post.currentUserVote === voteRequestDTO.isUpvote;
    let newUpvoteCount = post.upvoteCount;
    let newDownvoteCount = post.downvoteCount;
    let newCurrentUserVote: boolean | null;

    if (isToggleOff) {
        if (voteRequestDTO.isUpvote) newUpvoteCount -= 1;
        else newDownvoteCount -= 1;
        newCurrentUserVote = null;
    } else if (post.currentUserVote == null) {
        if (voteRequestDTO.isUpvote) newUpvoteCount += 1;
        else newDownvoteCount += 1;
        newCurrentUserVote = voteRequestDTO.isUpvote;
    } else {
        if (voteRequestDTO.isUpvote) { newUpvoteCount += 1; newDownvoteCount -= 1; }
        else { newDownvoteCount += 1; newUpvoteCount -= 1; }
        newCurrentUserVote = voteRequestDTO.isUpvote;
    }

    return {
        ...post,
        currentUserVote: newCurrentUserVote,
        upvoteCount: Math.max(0, newUpvoteCount),
        downvoteCount: Math.max(0, newDownvoteCount),
    };
};

const applyVoteToInfiniteList = (
    oldData: InfiniteData<PagedData<SelectPostDTO, string>> | undefined,
    postId: string,
    voteRequestDTO: VoteRequestDTO
): InfiniteData<PagedData<SelectPostDTO, string>> | undefined => {
    if (!oldData) return oldData;
    return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
            ...page,
            data: page.data.map((post) =>
                post.id === postId ? applyVoteToPost(post, voteRequestDTO) : post
            ),
        })),
    };
};

export const useUpdateVoteByPostId = (postId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (voteRequestDTO: VoteRequestDTO) => voteService.updateVoteByPostId(postId, voteRequestDTO),

        onMutate: async (voteRequestDTO) => {
            await queryClient.cancelQueries({ queryKey: postQueryKeys.all });
            await queryClient.cancelQueries({ queryKey: qaPostQueryKeys.all });

            const previousPostDetail = queryClient.getQueryData<SelectPostDTO>(postQueryKeys.detail(postId));
            const previousQaPostDetail = queryClient.getQueryData<SelectPostDTO>(qaPostQueryKeys.detail(postId));
            const previousPostLists = queryClient.getQueriesData<InfiniteData<PagedData<SelectPostDTO, string>>>({ queryKey: postQueryKeys.lists() });
            const previousQaPostLists = queryClient.getQueriesData<InfiniteData<PagedData<SelectPostDTO, string>>>({ queryKey: qaPostQueryKeys.lists() });

            if (previousPostDetail) {
                queryClient.setQueryData(postQueryKeys.detail(postId), applyVoteToPost(previousPostDetail, voteRequestDTO));
            }
            if (previousQaPostDetail) {
                queryClient.setQueryData(qaPostQueryKeys.detail(postId), applyVoteToPost(previousQaPostDetail, voteRequestDTO));
            }

            queryClient.setQueriesData<InfiniteData<PagedData<SelectPostDTO, string>>>(
                { queryKey: postQueryKeys.lists() },
                (old) => applyVoteToInfiniteList(old, postId, voteRequestDTO)
            );
            queryClient.setQueriesData<InfiniteData<PagedData<SelectPostDTO, string>>>(
                { queryKey: qaPostQueryKeys.lists() },
                (old) => applyVoteToInfiniteList(old, postId, voteRequestDTO)
            );

            return { previousPostDetail, previousQaPostDetail, previousPostLists, previousQaPostLists };
        },

        onError: (_error, _variables, context) => {
            if (context?.previousPostDetail) {
                queryClient.setQueryData(postQueryKeys.detail(postId), context.previousPostDetail);
            }
            if (context?.previousQaPostDetail) {
                queryClient.setQueryData(qaPostQueryKeys.detail(postId), context.previousQaPostDetail);
            }
            context?.previousPostLists?.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data);
            });
            context?.previousQaPostLists?.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data);
            });
        },

        // onSuccess: intentionally empty — onMutate already patched RAM via setQueryData/setQueriesData.
        // Zero-refetch pattern: no invalidateQueries here.
    });
};
