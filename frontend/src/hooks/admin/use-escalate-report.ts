import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminReportsService } from "@/services/admin-reports-service";
import { EscalateReportDTO } from "@/types/admin/admin-report-actions-dto";
import { adminQueryKeys } from "./admin-query-keys";

export const useEscalateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EscalateReportDTO }) =>
      adminReportsService.escalate(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.reports.all });
      toast.success("Report escalated");
    },
    onError: () => toast.error("Failed to escalate report"),
  });
};
