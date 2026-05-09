'use client';

import { useMemo } from 'react';
import { useGetQAPostsByProfileIdInfinite } from '@/hooks/qa-post-hooks/use-get-qa-posts-by-profile-id-infinite';
import { PostListView } from '@/components/post/post-list-view';
import { SortOrderType } from '@/constants/sortOrderType';

const STALE_TIME = 5 * 60 * 1000;

interface ProfileQAListProps {
    profileId: string;
}

export function ProfileQAList({ profileId }: ProfileQAListProps) {
    const {
        data,
        isLoading,
        isError,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useGetQAPostsByProfileIdInfinite(profileId, {
        totalElements: 0,
        orders: [{ sort: 'dateCreated', sortDir: SortOrderType.DESC, dynamicProperty: '', delimiter: '', dataType: '' }],
        filter: [],
        selected: []
    }, STALE_TIME);

    const posts = useMemo(
        () => data?.pages.flatMap((page) => page?.data ?? []),
        [data]
    );

    return (
        <PostListView
            posts={posts}
            isLoading={isLoading}
            isError={isError}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            onLoadMore={fetchNextPage}
            loadingText="Loading Q&A posts..."
            emptyTitle="No Q&A posts yet"
            emptySubtitle="This user hasn't asked or answered any questions."
        />
    );
}
