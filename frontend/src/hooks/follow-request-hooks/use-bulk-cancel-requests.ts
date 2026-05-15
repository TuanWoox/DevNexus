import { useMutation, useQueryClient } from "@tanstack/react-query";
import { followRequestService } from "@/services/follow-request-service";
import { followRequestQueryKeys } from "./follow-request-query-keys";
import { toast } from "sonner";

export function useBulkCancelRequests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestIds: string[]) => followRequestService.bulkCancel(requestIds),
    onSuccess: (count) => {
      if (count) {
        queryClient.invalidateQueries({ queryKey: followRequestQueryKeys.sent() });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        toast.success(`${count} request(s) cancelled`);
      }
    }
  });
}
