import { Page } from "@/types/common/page";
import { useInfiniteQuery } from "@tanstack/react-query";
import { userFollowQueryKeys } from "./use-user-follow-query-key";
import { userFollowService } from "@/services/user-follow-service";
import { INFINITE_PAGE_SIZE } from "@/constants/feed-payload";

export const useGetFollowersByProfileId = (
    profileId: string,
    request: Omit<Page<string>, "pageNumber" | "size">,
    enabled = true
) => {
    return useInfiniteQuery({
        queryKey: [...userFollowQueryKeys.lists(), 'byProfile', profileId, 'followers', { filters: request }],
        queryFn: ({ pageParam = 0 }) =>
            userFollowService.getFollowersByProfileId(profileId, {
                ...request,
                size: INFINITE_PAGE_SIZE,
                pageNumber: pageParam as number,
            } as Page<string>),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => {
            if (!lastPage || !lastPage.page) return undefined;
            const { pageNumber, size, totalElements } = lastPage.page;
            if (pageNumber === undefined || size === undefined || totalElements === undefined) return undefined;
            const loaded = (pageNumber + 1) * size;
            return loaded < totalElements ? pageNumber + 1 : undefined;
        },
        enabled: enabled && !!profileId,
    })
}
