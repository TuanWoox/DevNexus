'use client';

import { useMemo } from 'react';
import { PostListView } from "@/components/post/post-list-view";
import { SortOrderType } from "@/constants/sortOrderType";
import { useGetPostsInfinite } from "@/hooks/post-hooks/use-get-posts-infinite";

const BASE_PAYLOAD = {
    totalElements: 0,
    orders: [{ sort: 'dateCreated', sortDir: SortOrderType.DESC, dynamicProperty: '', delimiter: '', dataType: '' }],
    filter: [],
    selected: [],
};

export default function FeedPage() {
    const {
        data,
        isLoading,
        isError,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useGetPostsInfinite(BASE_PAYLOAD);

    // Flatten tất cả pages thành 1 array duy nhất
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
