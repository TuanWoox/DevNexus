import { useQuery } from "@tanstack/react-query";
import { communityModeratorsService } from "@/services/community-moderators-service";
import { communityModeratorsQueryKeys } from "./use-community-moderators-query-keys";
import { Page } from "@/types/common/page";

export const useGetCommunityModerators = (communityId: string, payload: Page<string>) => {
    return useQuery({
        queryKey: communityModeratorsQueryKeys.list(communityId, payload),
        queryFn: () => communityModeratorsService.getModeratorsWithPagination(communityId, payload),
        enabled: !!communityId,
    });
};
