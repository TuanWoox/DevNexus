import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminReportsService } from "@/services/admin-reports-service";
import { AssignReportDTO } from "@/types/admin/admin-report-actions-dto";
import { adminQueryKeys } from "./admin-query-keys";

export const useAssignReportToMe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: AssignReportDTO }) =>
      adminReportsService.assignToMe(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.reports.all });
      toast.success("Report assigned");
    },
  });
};
