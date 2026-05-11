import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profileMediaService } from "@/services/profile-media-service";
import { CreateProfileMediaDTO } from "@/types/profile-media/create-profile-media-dto";
import { toast } from "sonner";
import { profileMediaQueryKeys } from "./use-profile-media-query-keys";

export const useCreateProfileMedia = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateProfileMediaDTO) => profileMediaService.createProfileMedia(payload),
        onSuccess: (data) => {
            if (data) {
                // Invalidate both profile media lists and the main profile to fetch new avatar URL
                queryClient.invalidateQueries({ queryKey: profileMediaQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: ['profile', data.profileId] });
                toast.success("Image uploaded successfully!");
            }
        }
    });
};
