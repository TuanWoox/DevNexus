import { useMutation, useQueryClient } from "@tanstack/react-query";
import { followRequestService } from "@/services/follow-request-service";
import { toast } from "sonner";

export function useApproveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: followRequestService.approveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-requests"] });
      toast.success("Follow request accepted");
    },
    onError: () => {
      toast.error("Failed to accept request");
    },
  });
}
