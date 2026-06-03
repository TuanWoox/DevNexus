import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { communityMediaService } from "@/services/community-media-service";
import { communityMediaQueryKeys } from "./use-community-media-query-keys";
import { recommendationQueryKeys } from "@/hooks/recommendation-hooks/use-recommendation-query-keys";

export const useDeleteCommunityMedia = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => communityMediaService.deleteCommunityMedia(id),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: communityMediaQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: recommendationQueryKeys.all });
                toast.success("Media deleted successfully.");
            }
        }
    });
};
