import { useQuery } from "@tanstack/react-query";
import { communityQueryKeys } from "./use-community-query-key";
import { communityService } from "@/services/community-service";

export const useGetCommunityById = (communityId: string, isEnabled: boolean = true) => {
    return useQuery({
        queryKey: communityQueryKeys.detail(communityId),
        queryFn: () => communityService.getCommunityById(communityId),
        enabled: !!communityId && isEnabled,
    });
};

