"use client";

import { useMemo } from "react";
import { FilterOperator } from "@/constants/filterOperator";
import { FilterType } from "@/constants/filterType";
import { useGetRecommendedCommunitiesInfinite } from "@/hooks/recommendation-hooks/use-get-recommended-communities-infinite";
import { CommunityListView } from "./community-list-view";
import { SortOption } from "./explore-header";

interface RecommendedCommunityTabContentProps {
    searchQuery: string;
    sortOption: SortOption;
}

export function RecommendedCommunityTabContent({
    searchQuery,
    sortOption,
}: RecommendedCommunityTabContentProps) {
    const basePayload = useMemo(() => ({
        totalElements: 0,
        orders: [{
            sort: sortOption.sort,
            sortDir: sortOption.sortDir,
            dynamicProperty: "",
            delimiter: "",
            dataType: "string",
        }],
        filter: searchQuery ? [
            {
                prop: "Name",
                value: searchQuery,
                filterType: FilterType.Text,
                filterOperator: FilterOperator.Contains,
                dynamicProperty: "",
                delimiter: "",
            },
        ] : [],
        selected: [],
    }), [searchQuery, sortOption]);

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
        />
    );
}
