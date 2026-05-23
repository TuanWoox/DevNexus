import { postService } from "@/services/post-service";
import { Page } from "@/types/common/page";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { postQueryKeys } from "./use-post-query-keys";

const DEFAULT_PAYLOAD: Page<string> = {
    size: 20,
    pageNumber: 0,
    selected: [],
    filter: [],
    orders: []
};

export const useGetMyPendingPosts = (communityId: string, payload: Page<string> = DEFAULT_PAYLOAD) => {
    return useQuery({
        queryKey: postQueryKeys.list({ ...payload, communityId, type: "my-community-pending-posts" }),
        queryFn: () => postService.getMyPendingPostsByCommunityId(communityId, payload),
        placeholderData: keepPreviousData,
        enabled: !!communityId
    });
};
