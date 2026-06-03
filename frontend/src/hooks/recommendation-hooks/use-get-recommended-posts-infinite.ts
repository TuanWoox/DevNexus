import { useInfiniteQuery } from "@tanstack/react-query";
import { INFINITE_PAGE_SIZE } from "@/constants/feed-payload";
import { recommendationService } from "@/services/recommendation-service";
import { recommendationQueryKeys } from "./use-recommendation-query-keys";
import {
    getNextRecommendationPageParam,
    RecommendationInfiniteBasePayload,
    toMutableRecommendationPayload,
} from "./recommendation-infinite-utils";

export function useGetRecommendedPostsInfinite(
    basePayload: RecommendationInfiniteBasePayload,
    staleTime?: number
) {
    const mutablePayload = toMutableRecommendationPayload(basePayload);

    return useInfiniteQuery({
        queryKey: recommendationQueryKeys.postFeed({ ...mutablePayload, infinite: true }),
        queryFn: ({ pageParam = 0 }) =>
            recommendationService.getPersonalizedPostFeed({
                ...mutablePayload,
                size: INFINITE_PAGE_SIZE,
                pageNumber: pageParam as number,
            }),
        initialPageParam: 0,
        getNextPageParam: getNextRecommendationPageParam,
        staleTime,
    });
}
