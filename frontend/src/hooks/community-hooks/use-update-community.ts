import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { communityQueryKeys } from "./use-community-query-key";
import { UpdateCommunityDTO } from "@/types/community/update-community-dto";
import { communityService } from "@/services/community-service";
import { recommendationQueryKeys } from "@/hooks/recommendation-hooks/use-recommendation-query-keys";

export const useUpdateCommunity = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UpdateCommunityDTO) => communityService.updateCommunity(payload),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: communityQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: communityQueryKeys.detail(data.id) });
                queryClient.invalidateQueries({ queryKey: recommendationQueryKeys.all });
                toast.success("Community updated successfully!");
            }
        }
    });
};
