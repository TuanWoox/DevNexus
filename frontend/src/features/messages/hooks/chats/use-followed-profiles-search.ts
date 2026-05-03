import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { messagingQueryKeys } from "../messaging-query-keys";
import { profileService } from "../../services/profile-service";
import { Page } from "@/types/common/page";

export const useFollowedProfilesSearch = (query: string) => {
    const [debouncedQuery, setDebouncedQuery] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 500);
        return () => clearTimeout(timer);
    }, [query]);

    return useInfiniteQuery({
        queryKey: messagingQueryKeys.followedSearch(debouncedQuery),
        queryFn: ({ pageParam = 1 }) => {
            const page: Page<string> = {
                pageNumber: pageParam,
                size: 10,
                selected: [debouncedQuery],
            };
            return profileService.searchFollowedProfiles(page);
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const result = lastPage?.result;
            if (!result) return undefined;
            const { page, data } = result;
            if (!data || data.length < (page.size ?? 10)) return undefined;
            return (page.pageNumber ?? 1) + 1;
        },
        enabled: debouncedQuery.length >= 1,
        staleTime: 30_000,
    });
};
