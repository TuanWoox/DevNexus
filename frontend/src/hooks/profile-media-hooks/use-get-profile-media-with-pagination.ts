import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { profileMediaService } from "@/services/profile-media-service";
import { Page } from "@/types/common/page";
import { profileMediaQueryKeys } from "./use-profile-media-query-keys";

export const useGetProfileMediasWithPagination = (profileId: string, payload: Page<string>) => {
    return useQuery({
        queryKey: profileMediaQueryKeys.list(profileId, payload),
        queryFn: () => profileMediaService.getProfileMediasWithPagination(profileId, payload),
        placeholderData: keepPreviousData,
        enabled: !!profileId
    });
};
