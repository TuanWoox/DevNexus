import { voteService } from "@/services/vote-service";
import { VoteRequestDTO } from "@/types/vote/vote-request-dto";
import { SelectPostDTO } from "@/types/post/select-post-dto";
import { PagedData } from "@/types/common/paged-data";
import { useMutation, useQueryClient, InfiniteData } from "@tanstack/react-query";
import { postQueryKeys } from "@/hooks/post-hooks/use-post-query-keys";
import { qaPostQueryKeys } from "@/hooks/qa-post-hooks/use-qa-post-query-key";
import { bookmarkedItemQueryKeys } from "@/hooks/bookmarked-item-hooks/use-bookmarked-item-query-keys";
import { SelectBookmarkedItemDTO } from "@/types/bookmarked-item/select-bookmarked-item-dto";
import { searchQueryKeys } from "@/hooks/search-hooks/use-global-search";
import { GlobalSearchResult } from "@/types/search/global-search-result";
import { recommendationQueryKeys } from "@/hooks/recommendation-hooks/use-recommendation-query-keys";

const applyVoteToPost = <T extends SelectPostDTO>(post: T, voteRequestDTO: VoteRequestDTO): T => {
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

const applyVoteToFlatList = (
    oldData: SelectPostDTO[] | undefined,
    postId: string,
    voteRequestDTO: VoteRequestDTO
): SelectPostDTO[] | undefined => {
    if (!oldData) return oldData;
    return oldData.map((post) =>
        post.id === postId ? applyVoteToPost(post, voteRequestDTO) : post
    );
};

const applyVoteToBookmarkedList = (
    oldData: InfiniteData<PagedData<SelectBookmarkedItemDTO, string>> | undefined,
    postId: string,
    voteRequestDTO: VoteRequestDTO
): InfiniteData<PagedData<SelectBookmarkedItemDTO, string>> | undefined => {
    if (!oldData) return oldData;
    return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
            ...page,
            data: page.data.map((item) => {
                if (item.postId === postId && item.post) {
                    return { ...item, post: applyVoteToPost(item.post, voteRequestDTO) };
                }
                if (item.qaPostId === postId && item.qaPost) {
                    return { ...item, qaPost: applyVoteToPost(item.qaPost, voteRequestDTO) };
                }
                return item;
            }),
        })),
    };
};

const applyVoteToGlobalSearch = (
    oldData: GlobalSearchResult | undefined,
    postId: string,
    voteRequestDTO: VoteRequestDTO
): GlobalSearchResult | undefined => {
    if (!oldData) return oldData;
    return {
        ...oldData,
        posts: oldData.posts.map((post) =>
            post.id === postId ? applyVoteToPost(post, voteRequestDTO) : post
        ),
        qaPosts: oldData.qaPosts.map((post) =>
            post.id === postId ? applyVoteToPost(post, voteRequestDTO) : post
        ),
    };
};

export const useUpdateVoteByPostId = (postId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (voteRequestDTO: VoteRequestDTO) => voteService.updateVoteByPostId(postId, voteRequestDTO),

        onMutate: async (voteRequestDTO) => {
            await queryClient.cancelQueries({ queryKey: postQueryKeys.all });
            await queryClient.cancelQueries({ queryKey: qaPostQueryKeys.all });
            await queryClient.cancelQueries({ queryKey: bookmarkedItemQueryKeys.all });
            await queryClient.cancelQueries({ queryKey: searchQueryKeys.all });
            await queryClient.cancelQueries({ queryKey: recommendationQueryKeys.all });

            const previousPostDetail = queryClient.getQueryData<SelectPostDTO>(postQueryKeys.detail(postId));
            const previousQaPostDetail = queryClient.getQueryData<SelectPostDTO>(qaPostQueryKeys.detail(postId));
            const previousPostLists = queryClient.getQueriesData<InfiniteData<PagedData<SelectPostDTO, string>>>({ queryKey: postQueryKeys.lists() });
            const previousQaPostLists = queryClient.getQueriesData<InfiniteData<PagedData<SelectPostDTO, string>>>({ queryKey: qaPostQueryKeys.lists() });
            const previousBookmarkedLists = queryClient.getQueriesData<InfiniteData<PagedData<SelectBookmarkedItemDTO, string>>>({ queryKey: bookmarkedItemQueryKeys.lists() });
            const previousSearchQueries = queryClient.getQueriesData<any>({ queryKey: searchQueryKeys.all });
            const previousRecommendationQueries = queryClient.getQueriesData<any>({ queryKey: recommendationQueryKeys.all });

            if (previousPostDetail) {
                queryClient.setQueryData(postQueryKeys.detail(postId), applyVoteToPost(previousPostDetail, voteRequestDTO));
            }
            if (previousQaPostDetail) {
                queryClient.setQueryData(qaPostQueryKeys.detail(postId), applyVoteToPost(previousQaPostDetail, voteRequestDTO));
            }

            previousPostLists.forEach(([queryKey, oldData]) => {
                if (!oldData) return;
                if ("pages" in oldData) {
                    queryClient.setQueryData(queryKey, applyVoteToInfiniteList(oldData, postId, voteRequestDTO));
                }
            });
            previousQaPostLists.forEach(([queryKey, oldData]) => {
                if (!oldData) return;
                if ("pages" in oldData) {
                    queryClient.setQueryData(queryKey, applyVoteToInfiniteList(oldData, postId, voteRequestDTO));
                }
            });
            previousBookmarkedLists.forEach(([queryKey, oldData]) => {
                if (!oldData) return;
                if ("pages" in oldData) {
                    queryClient.setQueryData(queryKey, applyVoteToBookmarkedList(oldData, postId, voteRequestDTO));
                }
            });
            previousSearchQueries.forEach(([queryKey, oldData]: [any, any]) => {
                if (!oldData) return;
                if ("pages" in oldData) {
                    queryClient.setQueryData(queryKey, applyVoteToInfiniteList(oldData, postId, voteRequestDTO));
                } else {
                    queryClient.setQueryData(queryKey, applyVoteToGlobalSearch(oldData, postId, voteRequestDTO));
                }
            });
            previousRecommendationQueries.forEach(([queryKey, oldData]) => {
                if (!oldData) return;
                if ("pages" in oldData) {
                    queryClient.setQueryData(queryKey, applyVoteToInfiniteList(oldData, postId, voteRequestDTO));
                } else if (Array.isArray(oldData)) {
                    queryClient.setQueryData(queryKey, applyVoteToFlatList(oldData as SelectPostDTO[], postId, voteRequestDTO));
                }
            });

            return {
                previousPostDetail,
                previousQaPostDetail,
                previousPostLists,
                previousQaPostLists,
                previousBookmarkedLists,
                previousSearchQueries,
                previousRecommendationQueries,
            };
        },

        onError: (err, voteRequestDTO, context) => {
            if (context?.previousPostDetail) {
                queryClient.setQueryData(postQueryKeys.detail(postId), context.previousPostDetail);
            }
            if (context?.previousQaPostDetail) {
                queryClient.setQueryData(qaPostQueryKeys.detail(postId), context.previousQaPostDetail);
            }
            context?.previousPostLists.forEach(([queryKey, oldData]) => {
                queryClient.setQueryData(queryKey, oldData);
            });
            context?.previousQaPostLists.forEach(([queryKey, oldData]) => {
                queryClient.setQueryData(queryKey, oldData);
            });
            context?.previousBookmarkedLists.forEach(([queryKey, oldData]) => {
                queryClient.setQueryData(queryKey, oldData);
            });
            context?.previousSearchQueries.forEach(([queryKey, oldData]) => {
                queryClient.setQueryData(queryKey, oldData);
            });
            context?.previousRecommendationQueries.forEach(([queryKey, oldData]) => {
                queryClient.setQueryData(queryKey, oldData);
            });
        },

        // onSettled: () => {
        //     queryClient.invalidateQueries({ queryKey: postQueryKeys.all });
        //     queryClient.invalidateQueries({ queryKey: qaPostQueryKeys.all });
        //     queryClient.invalidateQueries({ queryKey: bookmarkedItemQueryKeys.all });
        // },
    });
};
