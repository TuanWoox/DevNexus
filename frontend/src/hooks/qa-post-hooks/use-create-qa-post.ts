import { qaPostService } from "@/services/qa-post-service";
import { CreateQAPostDTO } from "@/types/qa-post/create-qa-post-dto";
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { qaPostQueryKeys } from "./use-qa-post-query-key";
import { toast } from "sonner";
import { postQueryKeys } from "../post-hooks";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { SelectQAPostDTO } from "@/types/qa-post/select-qa-post-dto";
import { prependPostToInfiniteLists, replaceOptimisticPostInLists } from "@/hooks/post-hooks/post-cache-helper";

export const useCreateQAPost = () => {
    const queryClient = useQueryClient();
    const user = useSelector((state: RootState) => state.auth.user);

    return useMutation({
        mutationFn: (payload: CreateQAPostDTO) => qaPostService.createQAPost(payload),
        onMutate: async (payload) => {
            await Promise.all([
                queryClient.cancelQueries({ queryKey: postQueryKeys.lists() }),
                queryClient.cancelQueries({ queryKey: qaPostQueryKeys.lists() }),
            ]);

            const previousPostLists = queryClient.getQueriesData({ queryKey: postQueryKeys.lists() });
            const previousQaLists = queryClient.getQueriesData({ queryKey: qaPostQueryKeys.lists() });
            const now = new Date().toISOString();
            const optimisticId = `optimistic-${Date.now()}`;

            const optimisticPost: SelectQAPostDTO = {
                id: optimisticId,
                title: payload.title,
                content: payload.content,
                slug: payload.slug ?? optimisticId,
                postType: payload.postType,
                moderationStatus: "Pending",
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
                answerCount: 0,
                tagNames: payload.tagNames,
                dateCreated: now,
                dateModified: now,
                currentUserVote: null,
                isSaved: false,
                savedBookMarkedItemId: undefined,
                communityId: payload.communityId,
            };

            prependPostToInfiniteLists(queryClient, optimisticPost);
            return { previousPostLists, previousQaLists, optimisticId };
        },
        onError: (_error, _payload, context) => {
            context?.previousPostLists.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data);
            });
            context?.previousQaLists.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data);
            });
        },
        onSuccess: (data, _payload, context) => {
            if (data) {
                if (context?.optimisticId) {
                    replaceOptimisticPostInLists(queryClient, context.optimisticId, data);
                }
                queryClient.invalidateQueries({ queryKey: qaPostQueryKeys.lists() });
                toast.success("Post created successfully!");
            }
        }
    })
}
