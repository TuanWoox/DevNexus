import { useInfiniteQuery } from '@tanstack/react-query';
import { qaPostService } from '@/services/qa-post-service';
import { Page } from '@/types/common/page';
import { qaPostQueryKeys } from './use-qa-post-query-key';
import { INFINITE_PAGE_SIZE } from '@/constants/feed-payload';

type InfiniteBasePayload = {
    totalElements: number;
    orders?: ReadonlyArray<NonNullable<Page<string>['orders']>[number]>;
    filter?: ReadonlyArray<NonNullable<Page<string>['filter']>[number]>;
    selected?: ReadonlyArray<string>;
};

function toMutablePayload(basePayload: InfiniteBasePayload): Omit<Page<string>, 'pageNumber' | 'size'> {
    return {
        totalElements: basePayload.totalElements,
        orders: basePayload.orders ? [...basePayload.orders] : undefined,
        filter: basePayload.filter ? [...basePayload.filter] : undefined,
        selected: basePayload.selected ? [...basePayload.selected] : undefined,
    };
}

export function useGetQAPostsByCommunityIdInfinite(
    communityId: string,
    basePayload: InfiniteBasePayload,
    staleTime?: number,
    enabled: boolean = true,
) {
    const mutablePayload = toMutablePayload(basePayload);

    return useInfiniteQuery({
        queryKey: qaPostQueryKeys.list({ ...mutablePayload, communityId, type: 'community-qa', infinite: true }),
        queryFn: ({ pageParam = 0 }) =>
            qaPostService.getQAPostsByCommunityId(communityId, {
                ...mutablePayload,
                size: INFINITE_PAGE_SIZE,
                pageNumber: pageParam as number,
            }),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => {
            if (!lastPage) return undefined;
            const { pageNumber, size, totalElements } = lastPage.page;
            if (pageNumber === undefined || size === undefined || totalElements === undefined) return undefined;
            const loaded = (pageNumber + 1) * size;
            return loaded < totalElements ? pageNumber + 1 : undefined;
        },
        staleTime,
        enabled,
    });
}
