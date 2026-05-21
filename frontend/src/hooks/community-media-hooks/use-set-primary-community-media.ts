import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { communityMediaService } from "@/services/community-media-service";
import { communityMediaQueryKeys } from "./use-community-media-query-keys";
import { UpdatePrimaryCommunityMediaDTO } from "@/types/community-media/update-primary-community-media-dto";
import { communityQueryKeys } from "@/hooks/community-hooks/use-community-query-key";

export const useSetPrimaryCommunityMedia = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UpdatePrimaryCommunityMediaDTO) => communityMediaService.updatePrimaryCommunityMedia(payload),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: communityMediaQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: communityQueryKeys.detail(data.communityId) });
                queryClient.invalidateQueries({ queryKey: communityQueryKeys.lists() });
                toast.success("Cover photo updated successfully.");
            }
        }
    });
};
