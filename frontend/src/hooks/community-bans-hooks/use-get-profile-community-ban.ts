import { useQuery } from "@tanstack/react-query";
import { communityBansService } from "@/services/community-bans-service";
import { communityBansQueryKeys } from "./use-community-bans-query-keys";

export const useGetProfileCommunityBan = (
    communityId: string | null | undefined,
    profileId: string | null | undefined,
    enabled = true
) => {
    return useQuery({
        queryKey: communityBansQueryKeys.profileStatus(communityId ?? "", profileId ?? ""),
        queryFn: () => communityBansService.getProfileBanStatus(communityId!, profileId!),
        enabled: enabled && !!communityId && !!profileId,
        staleTime: 5 * 60 * 1000,
    });
};
