import { useQuery } from "@tanstack/react-query";
import { communityMutesService } from "@/services/community-mutes-service";
import { communityMuteQueryKeys } from "./use-community-mute-query-keys";
import { Page } from "@/types/common/page";

export const useGetCommunityMutes = (communityId: string, payload: Page<string>) => {
    return useQuery({
        queryKey: communityMuteQueryKeys.list(communityId, payload),
        queryFn: () => communityMutesService.getMutesWithPagination(communityId, payload),
        enabled: !!communityId,
    });
};
