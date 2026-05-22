import { useQuery } from "@tanstack/react-query";
import { communityMuteService } from "@/services/community-mute-service";
import { communityMuteQueryKeys } from "./use-community-mute-query-keys";

export const useGetCommunityMute = (communityId: string | null | undefined) => {
    return useQuery({
        queryKey: communityMuteQueryKeys.status(communityId ?? ""),
        queryFn: () => communityMuteService.getMuteStatus(communityId!),
        enabled: !!communityId,
        staleTime: 5 * 60 * 1000,
    });
};
