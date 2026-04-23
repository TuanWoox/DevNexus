import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profileMediaService } from "@/services/profile-media-service";
import { UpdatePrimaryProfileMediaDTO } from "@/types/profile-media/update-primary-profile-media-dto";
import { toast } from "sonner";
import { profileMediaQueryKeys } from "./use-profile-media-query-keys";

export const useUpdatePrimaryProfileMedia = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UpdatePrimaryProfileMediaDTO) => profileMediaService.updatePrimaryProfileMedia(payload),
        onSuccess: (data) => {
            if (data) {
                // Invalidate profile media lists and the main profile to refresh the UI avatar
                queryClient.invalidateQueries({ queryKey: profileMediaQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: ['profile', data.profileId] });
                const mediaType = data.profileMediaType === 0 ? "Avatar" : "Background";
                toast.success(`${mediaType} updated successfully!`);
            }
        }
    });
};
