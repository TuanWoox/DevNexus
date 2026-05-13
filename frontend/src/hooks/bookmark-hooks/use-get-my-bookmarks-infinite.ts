import { useInfiniteQuery } from "@tanstack/react-query";
import { bookmarkService } from "@/services/bookmark-service";
import { bookmarkQueryKeys } from "./use-bookmark-query-keys";
import { Page } from "@/types/common/page";
import { INFINITE_PAGE_SIZE } from "@/constants/feed-payload";

export const useGetMyBookmarksInfinite = (
    request: Omit<Page<string>, "pageNumber" | "size">,
    enabled = true
) => {
    return useInfiniteQuery({
        queryKey: bookmarkQueryKeys.list({ ...request, infinite: true }),
        queryFn: ({ pageParam = 0 }) =>
            bookmarkService.getMyBookmarks({
                ...request,
                size: INFINITE_PAGE_SIZE,
                pageNumber: pageParam as number,
            } as Page<string>),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => {
            if (!lastPage || !lastPage.page) return undefined;
            const { pageNumber, size, totalElements } = lastPage.page;
            if (pageNumber === undefined || size === undefined || totalElements === undefined) return undefined;
            const loaded = (pageNumber + 1) * size;
            return loaded < totalElements ? pageNumber + 1 : undefined;
        },
        enabled,
    });
};
