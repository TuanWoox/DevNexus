import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { communityRequestsService } from "@/services/community-requests-service";
import { communityRequestsQueryKeys } from "./use-community-requests-query-keys";

export const useRejectRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (requestId: string) => communityRequestsService.rejectRequest(requestId),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: communityRequestsQueryKeys.lists() });
                toast.success("Request rejected.");
            }
        }
    });
};
