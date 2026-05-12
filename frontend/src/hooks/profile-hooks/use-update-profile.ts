import { profileService } from "@/services/profile-service";
import { UpdateProfileDTO } from "@/types/profile/update-profile-dto";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: (payload: UpdateProfileDTO) => profileService.updateProfile(payload),
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: ['profile', data.id] });
                router.refresh();
                toast.success("Profile updated successfully!");
            }
        }
    });
};
