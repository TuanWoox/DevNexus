import { useInfiniteQuery } from "@tanstack/react-query";
import { bookmarkedItemService } from "@/services/bookmarked-item-service";
import { bookmarkedItemQueryKeys } from "./use-bookmarked-item-query-keys";
import { Page } from "@/types/common/page";
import { INFINITE_PAGE_SIZE } from "@/constants/feed-payload";

export const useGetBookmarkedItemsByBookmarkIdInfinite = (
    bookmarkId: string | null,
    request: Omit<Page<string>, "pageNumber" | "size">,
    enabled = true
) => {
    return useInfiniteQuery({
        queryKey: bookmarkedItemQueryKeys.list({ bookmarkId, ...request, infinite: true }),
        queryFn: ({ pageParam = 0 }) =>
            bookmarkedItemService.getItemByBookmarkId(bookmarkId as string, {
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
        enabled: enabled && !!bookmarkId,
    });
};
