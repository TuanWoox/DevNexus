import { postService } from "@/services/post-service";
import { Page } from "@/types/common/page";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { postQueryKeys } from "./use-post-query-keys";

export const useGetPostsByProfileId = (profileId: string, payload: Page<string>) => {
    return useQuery({
        queryKey: postQueryKeys.list({ ...payload, profileId, type: 'posts' }),
        queryFn: () => postService.getPostsByProfileId(profileId, payload),
        placeholderData: keepPreviousData,
        enabled: !!profileId,
    });
};
