"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { FilterOperator } from "@/constants/filterOperator";
import { FilterType } from "@/constants/filterType";
import { profileCommunityBlockService } from "@/services/profile-community-block-service";
import { Page } from "@/types/common/page";
import { profileCommunityBlockQueryKeys } from "./use-profile-community-block-query-keys";

const BLOCKED_COMMUNITIES_PAGE_SIZE = 20;

function buildBlockedCommunitiesPage(pageNumber: number, searchTerm: string): Page<string> {
    return {
        pageNumber,
        size: BLOCKED_COMMUNITIES_PAGE_SIZE,
        totalElements: 0,
        filter: searchTerm
            ? [
                {
                    prop: "Community.Name",
                    value: searchTerm,
                    filterType: FilterType.Text,
                    filterOperator: FilterOperator.Contains,
                    dynamicProperty: "",
                    delimiter: "",
                },
            ]
            : [],
        orders: [],
        selected: [],
    };
}

export function useGetMyBlockedCommunitiesInfinite(searchTerm: string, enabled: boolean) {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return useInfiniteQuery({
        queryKey: profileCommunityBlockQueryKeys.mine(normalizedSearchTerm),
        queryFn: ({ pageParam = 0 }) =>
            profileCommunityBlockService.getMyBlockedCommunitiesPaged(
                buildBlockedCommunitiesPage(pageParam as number, normalizedSearchTerm)
            ),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => {
            if (!lastPage?.page) return undefined;

            const { pageNumber, size, totalElements } = lastPage.page;
            if (pageNumber == null || size == null || totalElements == null) return undefined;

            const loaded = (pageNumber + 1) * size;
            return loaded < totalElements ? pageNumber + 1 : undefined;
        },
        enabled,
    });
}
