import { Page } from "@/types/common/page";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { bookmarkQueryKeys } from "./use-bookmark-query-keys";
import { bookmarkService } from "@/services/bookmark-service";

export const useGetMyBookmarks = (payload: Page<string>, enabled: boolean = true) => {
    return useQuery({
        queryKey: bookmarkQueryKeys.list(payload),
        queryFn: () => bookmarkService.getMyBookmarks(payload),
        placeholderData: keepPreviousData,
        enabled,
    });
};
