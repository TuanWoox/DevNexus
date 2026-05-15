import { useMutation, useQueryClient } from "@tanstack/react-query";
import { followRequestService } from "@/services/follow-request-service";
import { followRequestQueryKeys } from "./follow-request-query-keys";
import { userFollowQueryKeys } from "@/hooks/user-follow-hooks/use-user-follow-query-key";
import { toast } from "sonner";

export function useApproveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => followRequestService.approveRequest(requestId),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: followRequestQueryKeys.received() });
        queryClient.invalidateQueries({ queryKey: userFollowQueryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        toast.success("Follow request accepted");
      }
    }
  });
}
