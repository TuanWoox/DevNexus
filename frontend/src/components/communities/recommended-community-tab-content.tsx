"use client";

import { useMemo } from "react";
import { useGetRecommendedCommunitiesInfinite } from "@/hooks/recommendation-hooks/use-get-recommended-communities-infinite";
import { CommunityListView } from "./community-list-view";

export function RecommendedCommunityTabContent() {
    const basePayload = useMemo(() => ({
        totalElements: 0,
        orders: [],
        filter: [],
        selected: [],
    }), []);

    const {
        data,
        isLoading,
        isError,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useGetRecommendedCommunitiesInfinite(basePayload);

    const communities = useMemo(
        () => data?.pages.flatMap((page) => page?.data ?? []),
        [data]
    );

    return (
        <CommunityListView
            communities={communities}
            isLoading={isLoading}
            isError={isError}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            onLoadMore={fetchNextPage}
            loadingText="Loading recommended communities..."
            emptyTitle="No recommended communities yet"
            emptySubtitle="Join discussions and follow topics to improve your recommendations."
            isRecommendation={true}
        />
    );
}
