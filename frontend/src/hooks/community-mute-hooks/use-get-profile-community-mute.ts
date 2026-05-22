import { useQuery } from "@tanstack/react-query";
import { communityMuteService } from "@/services/community-mute-service";
import { communityMuteQueryKeys } from "./use-community-mute-query-keys";

export const useGetProfileCommunityMute = (
    communityId: string | null | undefined,
    profileId: string | null | undefined,
    enabled = true
) => {
    return useQuery({
        queryKey: communityMuteQueryKeys.profileStatus(communityId ?? "", profileId ?? ""),
        queryFn: () => communityMuteService.getProfileMuteStatus(communityId!, profileId!),
        enabled: enabled && !!communityId && !!profileId,
        staleTime: 5 * 60 * 1000,
    });
};
