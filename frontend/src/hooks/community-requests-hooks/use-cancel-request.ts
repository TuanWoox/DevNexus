import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { communityRequestsService } from "@/services/community-requests-service";
import { communityRequestsQueryKeys } from "./use-community-requests-query-keys";

export const useCancelRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (communityId: string) => communityRequestsService.cancelRequest(communityId),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: communityRequestsQueryKeys.lists() });
                toast.success("Join request cancelled.");
            }
        }
    });
};
