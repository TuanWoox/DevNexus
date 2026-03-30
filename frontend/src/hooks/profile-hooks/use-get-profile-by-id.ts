import { profileService } from "@/services/profile-service";
import { useQuery } from "@tanstack/react-query";

export const useGetProfileById = (profileId: string) => {
    return useQuery({
        queryKey: ['profile', profileId],
        queryFn: () => profileService.getProfileById(profileId),
        enabled: !!profileId,
    });
};

