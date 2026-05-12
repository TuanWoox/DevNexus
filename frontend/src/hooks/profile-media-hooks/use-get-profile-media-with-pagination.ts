import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { profileMediaService } from "@/services/profile-media-service";
import { Page } from "@/types/common/page";
import { profileMediaQueryKeys } from "./use-profile-media-query-keys";
import { ProfileMediaType } from "@/types/profile-media/profile-media-type";

export const useGetProfileMediasWithPagination = (profileId: string, profileMediaType: ProfileMediaType, payload: Page<string>) => {
    return useQuery({
        queryKey: profileMediaQueryKeys.list(profileId, profileMediaType, payload),
        queryFn: () => profileMediaService.getProfileMediasWithPagination(profileId, profileMediaType, payload),
        placeholderData: keepPreviousData,
        enabled: !!profileId
    });
};
