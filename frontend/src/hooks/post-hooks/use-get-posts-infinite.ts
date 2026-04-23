import { useInfiniteQuery } from '@tanstack/react-query';
import { postService } from '@/services/post-service';
import { Page } from '@/types/common/page';
import { postQueryKeys } from './use-post-query-keys';

const PAGE_SIZE = 20;

export function useGetPostsInfinite(basePayload: Omit<Page<string>, 'pageNumber' | 'size'>) {
    return useInfiniteQuery({
        queryKey: postQueryKeys.list({ ...basePayload, infinite: true }),
        queryFn: ({ pageParam = 0 }) =>
            postService.getPostsWithPagination({
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
