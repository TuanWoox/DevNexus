import { useInfiniteQuery } from '@tanstack/react-query';
import { postService } from '@/services/post-service';
import { Page } from '@/types/common/page';
import { postQueryKeys } from './use-post-query-keys';
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

export function useGetPostsInfinite(
    basePayload: InfiniteBasePayload,
    staleTime?: number,
) {
    const mutablePayload = toMutablePayload(basePayload);

    return useInfiniteQuery({
        queryKey: postQueryKeys.list({ ...mutablePayload, infinite: true }),
        queryFn: ({ pageParam = 0 }) =>
            postService.getPostsWithPagination({
                ...mutablePayload,
                size: INFINITE_PAGE_SIZE,
                pageNumber: pageParam as number,
            }),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => {
            if (!lastPage) return undefined;
            const { pageNumber, size, totalElements } = lastPage.page;
            if (pageNumber == null || totalElements == null) return undefined;
            const loaded = (pageNumber + 1) * size;
            return loaded < totalElements ? pageNumber + 1 : undefined;
        },
        staleTime,
    });
}
