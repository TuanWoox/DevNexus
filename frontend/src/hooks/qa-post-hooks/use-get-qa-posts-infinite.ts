import { useInfiniteQuery } from '@tanstack/react-query';
import { qaPostService } from '@/services/qa-post-service';
import { Page } from '@/types/common/page';
import { qaPostQueryKeys } from './use-qa-post-query-key';

const PAGE_SIZE = 20;

export function useGetQAPostsInfinite(basePayload: Omit<Page<string>, 'pageNumber' | 'size'>) {
    return useInfiniteQuery({
        queryKey: qaPostQueryKeys.list({ ...basePayload, infinite: true }),
        queryFn: ({ pageParam = 0 }) =>
            qaPostService.getQAPostWithPagination({
                ...basePayload,
                size: PAGE_SIZE,
                pageNumber: pageParam as number,
            }),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => {
            if (!lastPage) return undefined;
            const { pageNumber, size, totalElements } = lastPage.page;
            const loaded = (pageNumber + 1) * size;
            return loaded < totalElements ? pageNumber + 1 : undefined;
        },
    });
}
