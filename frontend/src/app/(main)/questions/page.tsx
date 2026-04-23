'use client';

import { useMemo } from 'react';
import { PostListView } from "@/components/post/post-list-view";
import { SortOrderType } from "@/constants/sortOrderType";
import { useGetQAPostsInfinite } from "@/hooks/qa-post-hooks/use-get-qa-posts-infinite";

const BASE_PAYLOAD = {
    totalElements: 0,
    orders: [{ sort: 'dateCreated', sortDir: SortOrderType.DESC, dynamicProperty: '', delimiter: '', dataType: '' }],
    filter: [],
    selected: [],
};

export default function QuestionsPage() {
    const {
        data,
        isLoading,
        isError,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useGetQAPostsInfinite(BASE_PAYLOAD);

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
