import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recommendationService } from "@/services/recommendation-service";
import { RecommendationFeedbackDTO } from "@/types/recommendation/recommendation-dtos";
import { recommendationQueryKeys } from "./use-recommendation-query-keys";

const filterRecommendationItem = (oldData: any, payload: RecommendationFeedbackDTO) => {
    if (!oldData) return oldData;

    // 1. Infinite query shape
    if ("pages" in oldData) {
        return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
                ...page,
                data: page.data.filter((item: any) => {
                    if (payload.postId && item.id === payload.postId) return false;
                    if (payload.qaPostId && item.id === payload.qaPostId) return false;
                    if (payload.communityId && item.id === payload.communityId) return false;
                    return true;
                }),
            })),
        };
    }

    // 2. Paginated data shape
    if ("data" in oldData && Array.isArray(oldData.data)) {
        return {
            ...oldData,
            data: oldData.data.filter((item: any) => {
                if (payload.postId && item.id === payload.postId) return false;
                if (payload.qaPostId && item.id === payload.qaPostId) return false;
                if (payload.communityId && item.id === payload.communityId) return false;
                return true;
            }),
        };
    }

    // 3. Flat array shape
    if (Array.isArray(oldData)) {
        return oldData.filter((item: any) => {
            if (payload.postId && item.id === payload.postId) return false;
            if (payload.qaPostId && item.id === payload.qaPostId) return false;
            if (payload.communityId && item.id === payload.communityId) return false;
            return true;
        });
    }

    return oldData;
};

export function useSubmitRecommendationFeedback() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: RecommendationFeedbackDTO) =>
            recommendationService.submitFeedback(payload),

        onMutate: async (payload) => {
            // Cancel any outgoing refetches so they don't overwrite our optimistic update
            await queryClient.cancelQueries({ queryKey: recommendationQueryKeys.all });

            // Snapshot the previous queries to restore in case of failure
            const previousRecommendationQueries = queryClient.getQueriesData<any>({
                queryKey: recommendationQueryKeys.all,
            });

            // Optimistically update all matching recommendation lists in the cache
            previousRecommendationQueries.forEach(([queryKey, oldData]) => {
                if (!oldData) return;
                queryClient.setQueryData(
                    queryKey,
                    filterRecommendationItem(oldData, payload)
                );
            });

            return { previousRecommendationQueries };
        },

        onError: (err, payload, context) => {
            // Restore previous cache state if mutation fails
            if (context?.previousRecommendationQueries) {
                context.previousRecommendationQueries.forEach(([queryKey, oldData]) => {
                    queryClient.setQueryData(queryKey, oldData);
                });
            }
        },

        onSettled: () => {
            // Invalidate recommendation queries to sync back with server state
            queryClient.invalidateQueries({ queryKey: recommendationQueryKeys.all });
        },
    });
}
