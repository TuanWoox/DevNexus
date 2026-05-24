import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { communityMediaQueryKeys } from "./use-community-media-query-keys";
import { CreateCommunityMediaDTO } from "@/types/community-media/create-community-media-dto";
import { communityMediaService } from "@/services/community-media-service";
import { communityQueryKeys } from "@/hooks/community-hooks/use-community-query-key";

export const useCreateCommunityMedia = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateCommunityMediaDTO) => communityMediaService.createCommunityMedia(payload),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: communityQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: communityMediaQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: communityQueryKeys.detail(data.communityId) });
                toast.success("Cover photo uploaded successfully!");
            }
        }
    });
};
