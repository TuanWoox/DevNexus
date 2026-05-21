"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { FilterOperator } from "@/constants/filterOperator";
import { FilterType } from "@/constants/filterType";
import { blockService } from "@/services/block-service";
import { Page } from "@/types/common/page";
import { blockQueryKeys } from "./use-block-query-keys";

const BLOCKS_PAGE_SIZE = 20;

function buildBlocksPage(pageNumber: number, searchTerm: string): Page<string> {
    return {
        pageNumber,
        size: BLOCKS_PAGE_SIZE,
        totalElements: 0,
        filter: searchTerm
            ? [
                {
                    prop: "BlockedProfile.FullName",
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

export function useGetMyBlocksInfinite(searchTerm: string, enabled: boolean) {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return useInfiniteQuery({
        queryKey: blockQueryKeys.mine(normalizedSearchTerm),
        queryFn: ({ pageParam = 0 }) =>
            blockService.getMyBlocksPaged(buildBlocksPage(pageParam as number, normalizedSearchTerm)),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => {
            if (!lastPage?.page) return undefined;

            const { pageNumber, size, totalElements } = lastPage.page;
            if (pageNumber == null || totalElements == null) return undefined;

            const loaded = (pageNumber + 1) * size;
            return loaded < totalElements ? pageNumber + 1 : undefined;
        },
        enabled,
    });
}
