import { useQuery } from "@tanstack/react-query";
import { communityMediaService } from "@/services/community-media-service";
import { communityMediaQueryKeys } from "./use-community-media-query-keys";
import { Page } from "@/types/common/page";

export const useGetCommunityMedias = (communityId: string, payload: Page<string>) => {
    return useQuery({
        queryKey: communityMediaQueryKeys.list(communityId, payload),
        queryFn: () => communityMediaService.getCommunityMediasWithPagination(communityId, payload),
        enabled: !!communityId,
    });
};
