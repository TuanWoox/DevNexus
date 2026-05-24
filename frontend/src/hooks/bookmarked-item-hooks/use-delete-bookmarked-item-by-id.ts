import { bookmarkedItemService } from "@/services/bookmarked-item-service";
import { useMutation, useQueryClient, InfiniteData } from "@tanstack/react-query"
import { toast } from "sonner";
import { bookmarkedItemQueryKeys } from "./use-bookmarked-item-query-keys";
import { postQueryKeys } from "@/hooks/post-hooks/use-post-query-keys";
import { qaPostQueryKeys } from "@/hooks/qa-post-hooks/use-qa-post-query-key";
import { searchQueryKeys } from "@/hooks/search-hooks/use-global-search";
import { GlobalSearchResult } from "@/types/search/global-search-result";
import { SelectPostDTO } from "@/types/post/select-post-dto";
import { SelectQAPostDTO } from "@/types/qa-post/select-qa-post-dto";
import { PagedData } from "@/types/common/paged-data";
import { SelectBookmarkedItemDTO } from "@/types/bookmarked-item/select-bookmarked-item-dto";

const unsavePost = <T extends SelectPostDTO | SelectQAPostDTO>(post: T, bookmarkedItemId: string): T => {
    if (post.savedBookMarkedItemId === bookmarkedItemId) {
        return {
            ...post,
            isSaved: false,
            savedBookMarkedItemId: null,
        };
    }
    return post;
};

const applyUnsaveToInfiniteList = <T extends SelectPostDTO | SelectQAPostDTO>(
    oldData: InfiniteData<PagedData<T, string>> | undefined,
    bookmarkedItemId: string
): InfiniteData<PagedData<T, string>> | undefined => {
    if (!oldData) return oldData;
    return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
            ...page,
            data: page.data.map((post) => unsavePost(post, bookmarkedItemId)),
        })),
    };
};

const applyUnsaveToGlobalSearch = (
    oldData: GlobalSearchResult | undefined,
    bookmarkedItemId: string
): GlobalSearchResult | undefined => {
    if (!oldData) return oldData;
    return {
        ...oldData,
        posts: oldData.posts.map((post) => unsavePost(post, bookmarkedItemId)),
        qaPosts: oldData.qaPosts.map((post) => unsavePost(post, bookmarkedItemId)),
    };
};

const applyDeletionToBookmarkedList = (
    oldData: InfiniteData<PagedData<SelectBookmarkedItemDTO, string>> | undefined,
    bookmarkedItemId: string
): InfiniteData<PagedData<SelectBookmarkedItemDTO, string>> | undefined => {
    if (!oldData) return oldData;
    return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
            ...page,
            data: page.data.filter((item) => item.id !== bookmarkedItemId),
        })),
    };
};

export const useDeleteBookmarkedItemById = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (bookmarkedItemId: string) => bookmarkedItemService.deleteById(bookmarkedItemId),

        onMutate: async (bookmarkedItemId) => {
            // 1. Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: bookmarkedItemQueryKeys.all });
            await queryClient.cancelQueries({ queryKey: postQueryKeys.all });
            await queryClient.cancelQueries({ queryKey: qaPostQueryKeys.all });
            await queryClient.cancelQueries({ queryKey: searchQueryKeys.all });

            // 2. Snapshot the previous values
            const previousPostLists = queryClient.getQueriesData<InfiniteData<PagedData<SelectPostDTO, string>>>({ queryKey: postQueryKeys.lists() });
            const previousQaPostLists = queryClient.getQueriesData<InfiniteData<PagedData<SelectQAPostDTO, string>>>({ queryKey: qaPostQueryKeys.lists() });
            const previousBookmarkedLists = queryClient.getQueriesData<InfiniteData<PagedData<SelectBookmarkedItemDTO, string>>>({ queryKey: bookmarkedItemQueryKeys.lists() });
            const previousSearchQueries = queryClient.getQueriesData<any>({ queryKey: searchQueryKeys.all });

            // Snapshot detail queries
            const previousPostDetails = queryClient.getQueriesData<SelectPostDTO>({ queryKey: postQueryKeys.details() });
            const previousQaPostDetails = queryClient.getQueriesData<SelectQAPostDTO>({ queryKey: qaPostQueryKeys.details() });

            // 3. Optimistically update the cache
            // Update Lists
            previousPostLists.forEach(([queryKey, oldData]) => {
                queryClient.setQueryData(queryKey, applyUnsaveToInfiniteList(oldData, bookmarkedItemId));
            });
            previousQaPostLists.forEach(([queryKey, oldData]) => {
                queryClient.setQueryData(queryKey, applyUnsaveToInfiniteList(oldData, bookmarkedItemId));
            });
            previousSearchQueries.forEach(([queryKey, oldData]: [any, any]) => {
                if (!oldData) return;
                if ("pages" in oldData) {
                    queryClient.setQueryData(queryKey, applyUnsaveToInfiniteList(oldData, bookmarkedItemId));
                } else {
                    queryClient.setQueryData(queryKey, applyUnsaveToGlobalSearch(oldData, bookmarkedItemId));
                }
            });
            previousBookmarkedLists.forEach(([queryKey, oldData]) => {
                queryClient.setQueryData(queryKey, applyDeletionToBookmarkedList(oldData, bookmarkedItemId));
            });

            // Update Details
            previousPostDetails.forEach(([queryKey, oldData]) => {
                if (oldData) {
                    queryClient.setQueryData(queryKey, unsavePost(oldData, bookmarkedItemId));
                }
            });
            previousQaPostDetails.forEach(([queryKey, oldData]) => {
                if (oldData) {
                    queryClient.setQueryData(queryKey, unsavePost(oldData, bookmarkedItemId));
                }
            });

            return {
                previousPostLists,
                previousQaPostLists,
                previousBookmarkedLists,
                previousPostDetails,
                previousQaPostDetails,
                previousSearchQueries
            };
        },

        onError: (err, bookmarkedItemId, context) => {
            // Rollback on error
            context?.previousPostLists.forEach(([queryKey, oldData]) => {
                queryClient.setQueryData(queryKey, oldData);
            });
            context?.previousQaPostLists.forEach(([queryKey, oldData]) => {
                queryClient.setQueryData(queryKey, oldData);
            });
            context?.previousBookmarkedLists.forEach(([queryKey, oldData]) => {
                queryClient.setQueryData(queryKey, oldData);
            });
            context?.previousPostDetails.forEach(([queryKey, oldData]) => {
                queryClient.setQueryData(queryKey, oldData);
            });
            context?.previousQaPostDetails.forEach(([queryKey, oldData]) => {
                queryClient.setQueryData(queryKey, oldData);
            });
            context?.previousSearchQueries.forEach(([queryKey, oldData]) => {
                queryClient.setQueryData(queryKey, oldData);
            });
        },

        onSuccess: (data) => {
            if (data) {
                toast.success("Bookmark removed successfully!");
            }
        },

        onSettled: () => {
            // Optional: refetch to ensure sync
            // queryClient.invalidateQueries({ queryKey: bookmarkedItemQueryKeys.all });
        }
    })
}
