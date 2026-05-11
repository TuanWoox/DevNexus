"use client";

import { useMemo } from "react";
import { CommunityFetchMode } from "@/constants/communityFetchMode";
import { useGetCommunitiesByModeInfinite } from "@/hooks/community-hooks/use-get-communities-by-mode-infinite";
import { CommunityListView } from "./community-list-view";
import { SortOption } from "./explore-header";
import { FilterType } from "@/constants/filterType";
import { FilterOperator } from "@/constants/filterOperator";

interface CommunityTabContentProps {
    mode: CommunityFetchMode;
    searchQuery: string;
    sortOption: SortOption;
}

export function CommunityTabContent({ mode, searchQuery, sortOption }: CommunityTabContentProps) {
    const basePayload = useMemo(() => ({
        totalElements: 0,
        fetchMode: mode,
        orders: [{
            sort: sortOption.sort,
            sortDir: sortOption.sortDir,
            dynamicProperty: "",
            delimiter: "",
            dataType: "string"
        }],
        filter: searchQuery ? [
            {
                prop: "Name",
                value: searchQuery,
                filterType: FilterType.Text,
                filterOperator: FilterOperator.Contains,
                dynamicProperty: "",
                delimiter: "",
            }
        ] : [],
        selected: [],
    }), [mode, searchQuery, sortOption]);

    const {
        data,
        isLoading,
        isError,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useGetCommunitiesByModeInfinite(basePayload);

    const communities = useMemo(
        () => data?.pages.flatMap((page) => page?.data ?? []),
        [data]
    );

    const emptyDetails = {
        [CommunityFetchMode.EXPLORE]: {
            title: "No new communities to explore",
            subtitle: "You've joined all available communities or none match your search."
        },
        [CommunityFetchMode.YOURS]: {
            title: "No communities yet",
            subtitle: "You haven't created or joined any communities yet. Start exploring!"
        },
        [CommunityFetchMode.ALL]: {
            title: "No results found",
            subtitle: "We couldn't find any communities matching your search query."
        }
    };

    return (
        <CommunityListView
            communities={communities}
            isLoading={isLoading}
            isError={isError}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            onLoadMore={fetchNextPage}
            emptyTitle={emptyDetails[mode].title}
            emptySubtitle={emptyDetails[mode].subtitle}
        />
    );
}
