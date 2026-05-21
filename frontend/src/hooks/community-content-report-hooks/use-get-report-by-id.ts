import { useQuery } from "@tanstack/react-query";
import { communityContentReportService } from "@/services/community-content-report-service";
import { ContentType } from "@/types/content-media/content-type";
import { communityReportQueryKeys } from "./use-community-report-query-keys";

export function useGetReportById<T>(
    communityId: string,
    contentType: ContentType,
    reportId: string,
    options?: { enabled?: boolean }
) {
    return useQuery({
        queryKey: communityReportQueryKeys.detail(reportId, contentType),
        queryFn: async () => {
            const response = await communityContentReportService.getReportById<T>(
                communityId,
                contentType,
                reportId
            );
            if (!response.result) {
                throw new Error(response.message || "Failed to load report detail");
            }
            return response.result;
        },
        enabled: !!communityId && !!reportId && options?.enabled !== false,
    });
}
