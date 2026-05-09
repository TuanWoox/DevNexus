import { useQuery } from "@tanstack/react-query";
import { communityBansService } from "@/services/community-bans-service";
import { communityBansQueryKeys } from "./use-community-bans-query-keys";
import { Page } from "@/types/common/page";

export const useGetCommunityBans = (communityId: string, payload: Page<string>) => {
    return useQuery({
        queryKey: communityBansQueryKeys.list(communityId, payload),
        queryFn: () => communityBansService.getBansWithPagination(communityId, payload),
        enabled: !!communityId,
    });
};
