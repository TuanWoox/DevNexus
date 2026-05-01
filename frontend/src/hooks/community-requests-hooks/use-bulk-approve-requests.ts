import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { communityRequestsService } from "@/services/community-requests-service";
import { communityRequestsQueryKeys } from "./use-community-requests-query-keys";
import { communityMembersQueryKeys } from "../community-members-hooks/use-community-members-query-keys";
import { Page } from "@/types/common/page";

export const useBulkApproveRequests = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ communityId, payload }: { communityId: string, payload: Page<string> }) =>
            communityRequestsService.bulkApproveRequests(communityId, payload),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: communityRequestsQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: communityMembersQueryKeys.lists() });
                toast.success("Requests approved successfully.");
            }
        }
    });
};
