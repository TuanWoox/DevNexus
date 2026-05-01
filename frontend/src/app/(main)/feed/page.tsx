import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/get-query-client';
import { serverPost } from '@/lib/server-api';
import { postQueryKeys } from '@/hooks/post-hooks/use-post-query-keys';
import { PagedData } from '@/types/common/paged-data';
import { SelectPostDTO } from '@/types/post/select-post-dto';
import { InfinitePostList } from '@/components/post/infinite-post-list';
import { FEED_BASE_PAYLOAD, INFINITE_PAGE_SIZE } from '@/constants/feed-payload';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Feed',
    description: 'Discover the latest discussions and Q&As from the DevNexus community.',
};

export default async function FeedPage() {
    const queryClient = getQueryClient();

    try {
        await queryClient.prefetchInfiniteQuery({
            queryKey: postQueryKeys.list({ ...FEED_BASE_PAYLOAD, infinite: true }),
            queryFn: ({ pageParam = 0 }) =>
                serverPost<PagedData<SelectPostDTO, string>>('/Posts/paging', {
                    ...FEED_BASE_PAYLOAD,
                    size: INFINITE_PAGE_SIZE,
                    pageNumber: pageParam as number,
                }),
            initialPageParam: 0,
            getNextPageParam: (lastPage) => {
                if (!lastPage) return undefined;
                const { pageNumber, size, totalElements } = lastPage.page;
                const loaded = (pageNumber + 1) * size;
                return loaded < totalElements ? pageNumber + 1 : undefined;
            },
            pages: 1,
        });
    } catch (error) {
        // Intentional: auth token expired → InfinitePostList self-fetches client-side.
        // Log in dev to surface misconfigurations and unexpected errors.
        if (process.env.NODE_ENV === 'development') {
            console.error('[SSR Prefetch Error] feed/page.tsx:', error);
        }
    }

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <InfinitePostList />
        </HydrationBoundary>
    );
}
