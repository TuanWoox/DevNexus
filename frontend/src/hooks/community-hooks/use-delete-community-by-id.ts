import { communityService } from "@/services/community-service";
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner";
import { communityQueryKeys } from "./use-community-query-key";
import { recommendationQueryKeys } from "@/hooks/recommendation-hooks/use-recommendation-query-keys";

export const useDeleteCommunityById = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (communityId: string) => communityService.deleteCommunityById(communityId),
        onSuccess: (data, communityId) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: communityQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: recommendationQueryKeys.all });
                queryClient.removeQueries({ queryKey: communityQueryKeys.detail(communityId) });
                toast.success("Community deleted successfully!");
            }
        }
    })
}
