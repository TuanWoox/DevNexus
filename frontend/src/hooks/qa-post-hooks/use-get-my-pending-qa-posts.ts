import { qaPostService } from "@/services/qa-post-service";
import { Page } from "@/types/common/page";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { qaPostQueryKeys } from "./use-qa-post-query-key";

const DEFAULT_PAYLOAD: Page<string> = {
    size: 20,
    pageNumber: 0,
    selected: [],
    filter: [],
    orders: []
};

export const useGetMyPendingQAPosts = (communityId: string, payload: Page<string> = DEFAULT_PAYLOAD) => {
    return useQuery({
        queryKey: qaPostQueryKeys.list({ ...payload, communityId, type: "my-community-pending-qa-posts" }),
        queryFn: () => qaPostService.getMyPendingQAPostsByCommunityId(communityId, payload),
        placeholderData: keepPreviousData,
        enabled: !!communityId
    });
};
