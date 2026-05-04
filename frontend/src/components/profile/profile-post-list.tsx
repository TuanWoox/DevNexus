'use client';

import { useMemo } from 'react';
import { useGetPostsByProfileIdInfinite } from '@/hooks/post-hooks/use-get-posts-by-profile-id-infinite';
import { PostListView } from '@/components/post/post-list-view';
import { SortOrderType } from '@/constants/sortOrderType';

const STALE_TIME = 5 * 60 * 1000;

interface ProfilePostListProps {
    profileId: string;
}

export function ProfilePostList({ profileId }: ProfilePostListProps) {
    const {
        data,
        isLoading,
        isError,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useGetPostsByProfileIdInfinite(profileId, {
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
            loadingText="Loading posts..."
            emptyTitle="No posts yet"
            emptySubtitle="This user hasn't created any posts."
        />
    );
}
