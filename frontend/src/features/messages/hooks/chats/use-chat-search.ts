import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { messagingQueryKeys } from "../messaging-query-keys";
import { chatService } from "../../services/chat-service";
import { Page } from "@/types/common/page";

export const useChatSearch = (query: string) => {
    const [debouncedQuery, setDebouncedQuery] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 750);
        return () => clearTimeout(timer);
    }, [query]);

    return useInfiniteQuery({
        queryKey: messagingQueryKeys.search(debouncedQuery),
        queryFn: ({ pageParam = 1 }) => {
            const page: Page<string> = {
                pageNumber: pageParam,
                size: 10,
                selected: [debouncedQuery],
            };
            return chatService.searchChats(page);
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const result = lastPage?.result;
            if (!result) return undefined;
            const { page, data } = result;
            if (!data || data.length < page.size) return undefined;
            return (page.pageNumber ?? 1) + 1;
        },
        enabled: debouncedQuery.length >= 1,
        staleTime: 30_000,
    });
};
