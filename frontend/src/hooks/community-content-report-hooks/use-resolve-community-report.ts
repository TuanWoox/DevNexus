import { useMutation, useQueryClient } from "@tanstack/react-query";
import { communityContentReportService } from "@/services/community-content-report-service";
import { ResolveReportDTO } from "@/types/community-content-report/resolve-report-dto";
import { ContentType } from "@/types/content-media/content-type";
import { communityReportQueryKeys } from "./use-community-report-query-keys";
import { toast } from "sonner";

interface ResolveReportParams {
    contentType: ContentType;
    payload: ResolveReportDTO;
}

export function useResolveCommunityReport(communityId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ contentType, payload }: ResolveReportParams) =>
            communityContentReportService.resolveReport(communityId, contentType, payload),
        onSuccess: (resolved) => {
            if (resolved) {
                queryClient.invalidateQueries({ queryKey: communityReportQueryKeys.all });
                toast.success("Report resolved successfully");
            } else {
                toast.error("Failed to resolve report");
            }
        },
        onError: () => {
            toast.error("Failed to resolve report");
        },
    });
}
