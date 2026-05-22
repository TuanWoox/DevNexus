import { postService } from "@/services/post-service";
import { CreatePostDTO } from "@/types/post/create-post-dto";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { postQueryKeys } from "./use-post-query-keys";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { SelectPostDTO } from "@/types/post/select-post-dto";
import { prependPostToInfiniteLists, replaceOptimisticPostInLists } from "./post-cache-helper";
import { CommunityApprovalStatus } from "@/types/enums/community-approval-status";

export const useCreatePost = () => {
    const queryClient = useQueryClient();
    const user = useSelector((state: RootState) => state.auth.user);

    return useMutation({
        mutationFn: (payload: CreatePostDTO) => postService.createPost(payload),
        onMutate: async (payload) => {
            await queryClient.cancelQueries({ queryKey: postQueryKeys.lists() });

            const previousLists = queryClient.getQueriesData({ queryKey: postQueryKeys.lists() });

            if (payload.communityId) {
                return { previousLists, optimisticId: undefined };
            }

            const now = new Date().toISOString();
            const optimisticId = `optimistic-${Date.now()}`;

            const optimisticPost: SelectPostDTO = {
                id: optimisticId,
                title: payload.title,
                content: payload.content,
                slug: payload.slug ?? optimisticId,
                postType: payload.postType,
                moderationStatus: "Pending",
                communityApprovalStatus: payload.communityId ? CommunityApprovalStatus.Pending : null,
                communityApprovalReason: payload.communityId ? "Awaiting moderator approval" : null,
                authorId: user?.profileId ?? "",
                author: user
                    ? {
                        id: user.profileId ?? "",
                        fullName: user.userName,
                        avatarUrl: undefined,
                        backgroundUrl: undefined,
                        bio: "",
                        reputationPoints: 0,
                        techStacks: [],
                        isPrivate: false,
                    }
                    : undefined,
                upvoteCount: 0,
                downvoteCount: 0,
                commentCount: 0,
                tagNames: payload.tagNames,
                dateCreated: now,
                dateModified: now,
                currentUserVote: null,
                isSaved: false,
                savedBookMarkedItemId: undefined,
                communityId: payload.communityId,
            };

            prependPostToInfiniteLists(queryClient, optimisticPost);
            return { previousLists, optimisticId };
        },
        onError: (error, _payload, context) => {
            context?.previousLists.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data);
            });
            toast.error(error instanceof Error ? error.message : "Post could not be created.");
        },
        onSuccess: (data, _payload, context) => {
            if (data) {
                if (context?.optimisticId) {
                    replaceOptimisticPostInLists(queryClient, context.optimisticId, data);
                }
                toast.success("Post created successfully!");
            }
        }
    });
};
