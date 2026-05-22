import { communityContentReportService } from "@/services/community-content-report-service";
import { ReportContentDTO } from "@/types/community-content-report/report-content-dto";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface CreateCommunityContentReportPayload {
    communityId: string;
    payload: ReportContentDTO;
}

export const useCreateCommunityContentReport = () => {
    return useMutation({
        mutationFn: ({ communityId, payload }: CreateCommunityContentReportPayload) =>
            communityContentReportService.reportContent(communityId, payload),
        onSuccess: (created) => {
            if (created) {
                toast.success("Report submitted to community moderators.");
            }
        },
        onError: () => {
            toast.error("Failed to submit report.");
        },
    });
};
