import { useQuery } from "@tanstack/react-query";
import { messagingQueryKeys } from "../messaging-query-keys";
import { profileService } from "../../services/profile-service";

export const useProfileById = (profileId: string | null) => {
    return useQuery({
        queryKey: messagingQueryKeys.profileById(profileId ?? ""),
        queryFn: () => profileService.getProfileById(profileId!),
        enabled: !!profileId,
        staleTime: 60_000,
        select: (data) => data.result ?? null,
    });
};
