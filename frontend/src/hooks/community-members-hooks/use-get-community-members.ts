import { useQuery } from "@tanstack/react-query";
import { communityMembersService } from "@/services/community-members-service";
import { communityMembersQueryKeys } from "./use-community-members-query-keys";
import { Page } from "@/types/common/page";

export const useGetCommunityMembers = (communityId: string, payload: Page<string>) => {
    return useQuery({
        queryKey: communityMembersQueryKeys.list(communityId, payload),
        queryFn: () => communityMembersService.getCommunityMembersWithPagination(communityId, payload),
        enabled: !!communityId,
    });
};
