import { Page } from "@/types/common/page";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { bookmarkedItemQueryKeys } from "./use-bookmarked-item-query-keys";
import { bookmarkedItemService } from "@/services/bookmarked-item-service";

export const useGetBookmarkedItemsByBookmarkId = (bookmarkId: string, payload: Page<string>) => {
    return useQuery({
        queryKey: bookmarkedItemQueryKeys.list({ bookmarkId, ...payload }),
        queryFn: () => bookmarkedItemService.getItemByBookmarkId(bookmarkId, payload),
        placeholderData: keepPreviousData,
        enabled: !!bookmarkId,
    });
};
