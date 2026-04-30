'use client';

import { useMemo } from 'react';
import { useGetQAPostsInfinite } from '@/hooks/qa-post-hooks/use-get-qa-posts-infinite';
import { PostListView } from './post-list-view';
import { QUESTIONS_BASE_PAYLOAD } from '@/constants/feed-payload';

const STALE_TIME = 5 * 60 * 1000;

export function InfiniteQAPostList() {
    const {
        data,
        isLoading,
        isError,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useGetQAPostsInfinite(QUESTIONS_BASE_PAYLOAD, STALE_TIME);

    const posts = useMemo(
        () => data?.pages.flatMap((page) => page?.data ?? []),
        [data]
    );

    return (
        <PostListView
            title="Questions"
            subtitle="Discover the latest Q&As."
            posts={posts}
            isLoading={isLoading}
            isError={isError}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            onLoadMore={fetchNextPage}
            loadingText="Loading Q&A posts..."
            errorText="Failed to load Q&A posts. Please try again."
            emptyTitle="No Q&A posts yet"
            emptySubtitle="Check back later or create a new Q&A post to get started."
        />
    );
}
