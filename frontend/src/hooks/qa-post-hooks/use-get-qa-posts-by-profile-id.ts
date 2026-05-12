import { qaPostService } from "@/services/qa-post-service";
import { Page } from "@/types/common/page";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { qaPostQueryKeys } from "./use-qa-post-query-key";

export const useGetQAPostsByProfileId = (profileId: string, payload: Page<string>) => {
    return useQuery({
        queryKey: qaPostQueryKeys.list({ ...payload, profileId, type: 'qa-posts' }),
        queryFn: () => qaPostService.getQAPostsByProfileId(profileId, payload),
        placeholderData: keepPreviousData,
        enabled: !!profileId,
    });
};
