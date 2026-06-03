import { Page } from "@/types/common/page";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { communityService } from "@/services/community-service";
import { communityQueryKeys } from "./use-community-query-key";
import { recommendationQueryKeys } from "@/hooks/recommendation-hooks/use-recommendation-query-keys";

export const useDeleteCommunities = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: Page<string>) => communityService.deleteCommunities(payload),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: communityQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: recommendationQueryKeys.all });
                toast.success(`Deleted ${data} communities successfully!`);
            }
        }
    });
};
