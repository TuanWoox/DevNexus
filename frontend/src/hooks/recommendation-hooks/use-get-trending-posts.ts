import { useQuery } from "@tanstack/react-query";
import { recommendationService } from "@/services/recommendation-service";
import { recommendationQueryKeys } from "./use-recommendation-query-keys";

export function useGetTrendingPosts(period = "7d", limit = 5) {
    return useQuery({
        queryKey: recommendationQueryKeys.trendingPosts(period, limit),
        queryFn: () => recommendationService.getTrendingPosts(period, limit),
        staleTime: 5 * 60 * 1000,
    });
}
