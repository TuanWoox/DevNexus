import { Page } from "@/types/common/page";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { communityQueryKeys } from "./use-community-query-key";
import { communityService } from "@/services/community-service";

export const useGetCommunitiesWithPagination = (payload: Page<string>) => {
    return useQuery({
        queryKey: communityQueryKeys.list(payload),
        queryFn: () => communityService.getCommunitiesWithPagination(payload),
        placeholderData: keepPreviousData,
    });
};
