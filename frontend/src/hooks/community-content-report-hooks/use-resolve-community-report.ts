import { useMutation, useQueryClient } from "@tanstack/react-query";
import { communityContentReportService } from "@/services/community-content-report-service";
import { ResolveReportDTO } from "@/types/community-content-report/resolve-report-dto";
import { ContentType } from "@/types/content-media/content-type";
import { communityReportQueryKeys } from "./use-community-report-query-keys";

interface ResolveReportParams {
    contentType: ContentType;
    payload: ResolveReportDTO;
}

export function useResolveCommunityReport(communityId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ contentType, payload }: ResolveReportParams) =>
            communityContentReportService.resolveReport(communityId, contentType, payload),
        onSuccess: (result) => {
            if (result.result) {
                queryClient.invalidateQueries({ queryKey: communityReportQueryKeys.all });
            }
        },
    });
}
