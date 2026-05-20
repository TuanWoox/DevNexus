import { useQuery } from "@tanstack/react-query";
import { communityContentReportService } from "@/services/community-content-report-service";
import { communityReportQueryKeys } from "./use-community-report-query-keys";
import { Page } from "@/types/common/page";
import { ContentType } from "@/types/content-media/content-type";

export const useGetCommunityReportsUser = <T>(
    communityId: string,
    contentType: ContentType,
    payload: Page<string>
) => {
    return useQuery({
        queryKey: communityReportQueryKeys.list(communityId, false, contentType, payload),
        queryFn: () => communityContentReportService.getPagingDataForCurrentUser<T>(communityId, contentType, payload),
        enabled: !!communityId,
    });
};
