import { postService } from "@/services/post-service";
import { Page } from "@/types/common/page";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { postQueryKeys } from "./use-post-query-keys";

export const useGetPostsByCommunityId = (communityId: string, payload: Page<string>) => {
    return useQuery({
        queryKey: postQueryKeys.list({ ...payload, communityId, type: 'community-posts' }),
        queryFn: () => postService.getPostsByCommunityId(communityId, payload),
        placeholderData: keepPreviousData,
        enabled: !!communityId,
    });
};
