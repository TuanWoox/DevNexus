import { useInfiniteQuery } from "@tanstack/react-query";
import { communityService } from "@/services/community-service";
import { communityQueryKeys } from "./use-community-query-key";
import { CommunityPageRequest } from "@/types/common/community-page-request";
import { INFINITE_PAGE_SIZE } from "@/constants/feed-payload";

export const useGetCommunitiesByModeInfinite = (
    request: Omit<CommunityPageRequest, "pageNumber" | "size">,
    enabled = true
) => {
    return useInfiniteQuery({
        queryKey: communityQueryKeys.list({ ...request, infinite: true }),
        queryFn: ({ pageParam = 0 }) =>
            communityService.getCommunitiesByMode({
                ...request,
                size: INFINITE_PAGE_SIZE,
                pageNumber: pageParam as number,
            }),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => {
            if (!lastPage || !lastPage.page) return undefined;
            const { pageNumber, size, totalElements } = lastPage.page;
            const loaded = (pageNumber + 1) * size;
            return loaded < totalElements ? pageNumber + 1 : undefined;
        },
        enabled,
    });
};
