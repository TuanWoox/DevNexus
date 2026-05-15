import { useMutation, useQueryClient } from "@tanstack/react-query";
import { followRequestService } from "@/services/follow-request-service";
import { followRequestQueryKeys } from "./follow-request-query-keys";
import { userFollowQueryKeys } from "@/hooks/user-follow-hooks/use-user-follow-query-key";
import { toast } from "sonner";

export function useBulkApproveRequests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestIds: string[]) => followRequestService.bulkApprove(requestIds),
    onSuccess: (count) => {
      if (count) {
        queryClient.invalidateQueries({ queryKey: followRequestQueryKeys.received() });
        queryClient.invalidateQueries({ queryKey: userFollowQueryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        toast.success(`${count} request(s) accepted`);
      }
    }
  });
}
