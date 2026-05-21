import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminReportsService } from "@/services/admin-reports-service";
import { DismissReportDTO } from "@/types/admin/admin-report-actions-dto";
import { adminQueryKeys } from "./admin-query-keys";

export const useDismissReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DismissReportDTO }) =>
      adminReportsService.dismiss(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.reports.all });
      toast.success("Report dismissed");
    },
  });
};
