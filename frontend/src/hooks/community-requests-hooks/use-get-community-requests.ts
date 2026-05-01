import { useQuery } from "@tanstack/react-query";
import { communityRequestsService } from "@/services/community-requests-service";
import { communityRequestsQueryKeys } from "./use-community-requests-query-keys";
import { Page } from "@/types/common/page";

export const useGetCommunityRequests = (communityId: string, payload: Page<string>) => {
    return useQuery({
        queryKey: communityRequestsQueryKeys.list(communityId, payload),
        queryFn: () => communityRequestsService.getRequestsWithPagination(communityId, payload),
        enabled: !!communityId,
    });
};
