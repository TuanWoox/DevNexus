import { Page } from "@/types/common/page";
import { ProfileMediaType } from "@/types/profile-media/profile-media-type";

export const profileMediaQueryKeys = {
    all: ['profile-media'] as const,
    lists: () => [...profileMediaQueryKeys.all, 'list'] as const,
    list: (profileId: string, profileMediaType: ProfileMediaType, payload: Page<string>) => [...profileMediaQueryKeys.lists(), profileId, profileMediaType, payload] as const,
};
