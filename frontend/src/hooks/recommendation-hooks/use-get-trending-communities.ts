import { useQuery } from "@tanstack/react-query";
import { recommendationService } from "@/services/recommendation-service";
import { recommendationQueryKeys } from "./use-recommendation-query-keys";

export function useGetTrendingCommunities(period = "7d", limit = 5) {
    return useQuery({
        queryKey: recommendationQueryKeys.trendingCommunities(period, limit),
        queryFn: () => recommendationService.getTrendingCommunities(period, limit),
    });
}
