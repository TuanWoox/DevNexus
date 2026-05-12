import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { communityQueryKeys } from "./use-community-query-key";
import { communityService } from "@/services/community-service";
import { CommunityPageRequest } from "@/types/common/community-page-request";

export const useGetCommunitiesByMode = (request: CommunityPageRequest, enabled = true) => {
    return useQuery({
        queryKey: communityQueryKeys.list(request),
        queryFn: () => communityService.getCommunitiesByMode(request),
        placeholderData: keepPreviousData,
        enabled,
    });
};
