'use client';

import { useMemo } from 'react';
import { useGetPostsInfinite } from '@/hooks/post-hooks/use-get-posts-infinite';
import { PostListView } from './post-list-view';
import { FEED_BASE_PAYLOAD } from '@/constants/feed-payload';

const STALE_TIME = 5 * 60 * 1000;

export function InfinitePostList() {
    const {
        data,
        isLoading,
        isError,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useGetPostsInfinite(FEED_BASE_PAYLOAD, STALE_TIME);

    const posts = useMemo(
        () => data?.pages.flatMap((page) => page?.data ?? []),
        [data]
    );

    return (
        <PostListView
            title="Your Feed"
            subtitle="Discover the latest discussions and Q&As."
            posts={posts}
            isLoading={isLoading}
            isError={isError}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            onLoadMore={fetchNextPage}
            loadingText="Loading posts..."
            emptyTitle="No posts yet"
            emptySubtitle="Check back later or create a new post to get started."
        />
    );
}
