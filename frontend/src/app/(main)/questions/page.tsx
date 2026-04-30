import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/get-query-client';
import { serverPost } from '@/lib/server-api';
import { qaPostQueryKeys } from '@/hooks/qa-post-hooks/use-qa-post-query-key';
import { PagedData } from '@/types/common/paged-data';
import { SelectQAPostDTO } from '@/types/qa-post/select-qa-post-dto';
import { InfiniteQAPostList } from '@/components/post/infinite-qa-post-list';
import { QUESTIONS_BASE_PAYLOAD, INFINITE_PAGE_SIZE } from '@/constants/feed-payload';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Questions',
    description: 'Find answers to technical questions from the DevNexus engineering community.',
};

export default async function QuestionsPage() {
    const queryClient = getQueryClient();

    try {
        await queryClient.prefetchInfiniteQuery({
            queryKey: qaPostQueryKeys.list({ ...QUESTIONS_BASE_PAYLOAD, infinite: true }),
            queryFn: ({ pageParam = 0 }) =>
                serverPost<PagedData<SelectQAPostDTO, string>>('/QAPosts/paging', {
                    ...QUESTIONS_BASE_PAYLOAD,
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
        // Intentional: auth token expired → InfiniteQAPostList self-fetches client-side.
        // Log in dev to surface misconfigurations and unexpected errors.
        if (process.env.NODE_ENV === 'development') {
            console.error('[SSR Prefetch Error] questions/page.tsx:', error);
        }
    }

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <InfiniteQAPostList />
        </HydrationBoundary>
    );
}
