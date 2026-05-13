'use client';

import { useMemo } from 'react';
import { useGetOverviewByProfileIdInfinite } from '@/hooks/post-hooks/use-get-overview-by-profile-id-infinite';
import { PostListView } from '@/components/post/post-list-view';
import { SortOrderType } from '@/constants/sortOrderType';

const STALE_TIME = 5 * 60 * 1000;

interface ProfileOverviewListProps {
    profileId: string;
}

export function ProfileOverviewList({ profileId }: ProfileOverviewListProps) {
    const {
        data,
        isLoading,
        isError,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useGetOverviewByProfileIdInfinite(profileId, {
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
            loadingText="Loading recent activities..."
            emptyTitle="No recent activities"
            emptySubtitle="This user hasn't posted anything yet."
        />


    );
}
