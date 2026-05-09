import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { communityRequestsService } from "@/services/community-requests-service";
import { communityRequestsQueryKeys } from "./use-community-requests-query-keys";
import { Page } from "@/types/common/page";

export const useBulkRejectRequests = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ communityId, payload }: { communityId: string, payload: Page<string> }) =>
            communityRequestsService.bulkRejectRequests(communityId, payload),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: communityRequestsQueryKeys.lists() });
                toast.success("Requests rejected successfully.");
            }
        }
    });
};
