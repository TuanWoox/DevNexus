import { qaPostService } from "@/services/qa-post-service";
import { Page } from "@/types/common/page";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { qaPostQueryKeys } from "./use-qa-post-query-key";

export const useGetQAPostsByCommunityId = (communityId: string, payload: Page<string>) => {
    return useQuery({
        queryKey: qaPostQueryKeys.list({ ...payload, communityId, type: 'community-qa' }),
        queryFn: () => qaPostService.getQAPostsByCommunityId(communityId, payload),
        placeholderData: keepPreviousData,
        enabled: !!communityId,
    });
};
