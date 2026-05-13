import { bookmarkedItemService } from "@/services/bookmarked-item-service";
import { CreateBookmarkedItemDTO } from "@/types/bookmarked-item/create-bookmarked-item-dto";
import { useMutation, useQueryClient, InfiniteData } from "@tanstack/react-query"
import { bookmarkedItemQueryKeys } from "./use-bookmarked-item-query-keys";
import { postQueryKeys } from "@/hooks/post-hooks/use-post-query-keys";
import { qaPostQueryKeys } from "../qa-post-hooks/use-qa-post-query-key";
import { SelectPostDTO } from "@/types/post/select-post-dto";
import { SelectQAPostDTO } from "@/types/qa-post/select-qa-post-dto";
import { PagedData } from "@/types/common/paged-data";
import { toast } from "sonner";

const markAsSaved = <T extends SelectPostDTO | SelectQAPostDTO>(post: T, targetId: string, bookmarkItemId: string): T => {
    if (post.id === targetId) {
        return {
            ...post,
            isSaved: true,
            savedBookMarkedItemId: bookmarkItemId,
        };
    }
    return post;
};

const applySaveToInfiniteList = <T extends SelectPostDTO | SelectQAPostDTO>(
    oldData: InfiniteData<PagedData<T, string>> | undefined,
    targetId: string,
    bookmarkItemId: string
): InfiniteData<PagedData<T, string>> | undefined => {
    if (!oldData) return oldData;
    return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
            ...page,
            data: page.data.map((post) => markAsSaved(post, targetId, bookmarkItemId)),
        })),
    };
};

export const useCreateBookmarkedItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateBookmarkedItemDTO) => bookmarkedItemService.createBookmarkedItem(payload),
        
        onMutate: async (payload) => {
            const targetId = payload.postId || payload.qaPostId;
            if (!targetId) return;

            const tempId = `temp-${Date.now()}`;

            // 1. Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: postQueryKeys.all });
            await queryClient.cancelQueries({ queryKey: qaPostQueryKeys.all });
            await queryClient.cancelQueries({ queryKey: bookmarkedItemQueryKeys.all });

            // 2. Snapshot previous values
            const previousPostLists = queryClient.getQueriesData<InfiniteData<PagedData<SelectPostDTO, string>>>({ queryKey: postQueryKeys.lists() });
            const previousQaPostLists = queryClient.getQueriesData<InfiniteData<PagedData<SelectQAPostDTO, string>>>({ queryKey: qaPostQueryKeys.lists() });
            const previousPostDetails = queryClient.getQueriesData<SelectPostDTO>({ queryKey: postQueryKeys.details() });
            const previousQaPostDetails = queryClient.getQueriesData<SelectQAPostDTO>({ queryKey: qaPostQueryKeys.details() });

            // 3. Optimistically update lists
            previousPostLists.forEach(([queryKey, oldData]) => {
                queryClient.setQueryData(queryKey, applySaveToInfiniteList(oldData, targetId, tempId));
            });
            previousQaPostLists.forEach(([queryKey, oldData]) => {
                queryClient.setQueryData(queryKey, applySaveToInfiniteList(oldData, targetId, tempId));
            });

            // 4. Optimistically update details
            previousPostDetails.forEach(([queryKey, oldData]) => {
                if (oldData) queryClient.setQueryData(queryKey, markAsSaved(oldData, targetId, tempId));
            });
            previousQaPostDetails.forEach(([queryKey, oldData]) => {
                if (oldData) queryClient.setQueryData(queryKey, markAsSaved(oldData, targetId, tempId));
            });

            return { 
                previousPostLists, 
                previousQaPostLists, 
                previousPostDetails, 
                previousQaPostDetails,
                targetId
            };
        },

        onError: (err, payload, context) => {
            // Rollback
            context?.previousPostLists.forEach(([queryKey, oldData]) => queryClient.setQueryData(queryKey, oldData));
            context?.previousQaPostLists.forEach(([queryKey, oldData]) => queryClient.setQueryData(queryKey, oldData));
            context?.previousPostDetails.forEach(([queryKey, oldData]) => queryClient.setQueryData(queryKey, oldData));
            context?.previousQaPostDetails.forEach(([queryKey, oldData]) => queryClient.setQueryData(queryKey, oldData));
            toast.error("Failed to save item.");
        },

        onSuccess: (data, payload, context) => {
            if (data && context?.targetId) {
                const realId = data.id;
                const targetId = context.targetId;

                // Update cache with the real ID from the server
                const updateWithRealId = <T extends SelectPostDTO | SelectQAPostDTO>(post: T): T => {
                    if (post.id === targetId) {
                        return { ...post, savedBookMarkedItemId: realId };
                    }
                    return post;
                };

                queryClient.setQueriesData<InfiniteData<PagedData<SelectPostDTO, string>>>({ queryKey: postQueryKeys.lists() }, (oldData) => {
                    if (!oldData) return oldData;
                    return { ...oldData, pages: oldData.pages.map(p => ({ ...p, data: p.data.map(updateWithRealId) })) };
                });

                queryClient.setQueriesData<InfiniteData<PagedData<SelectQAPostDTO, string>>>({ queryKey: qaPostQueryKeys.lists() }, (oldData) => {
                    if (!oldData) return oldData;
                    return { ...oldData, pages: oldData.pages.map(p => ({ ...p, data: p.data.map(updateWithRealId) })) };
                });

                queryClient.setQueriesData<SelectPostDTO>({ queryKey: postQueryKeys.details() }, (oldData) => {
                    return oldData ? updateWithRealId(oldData) : oldData;
                });

                queryClient.setQueriesData<SelectQAPostDTO>({ queryKey: qaPostQueryKeys.details() }, (oldData) => {
                    return oldData ? updateWithRealId(oldData) : oldData;
                });

                toast.success("Item saved successfully!");
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: bookmarkedItemQueryKeys.lists() });
        }
    })
}
