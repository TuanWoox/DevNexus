import { Page } from "@/types/common/page";

export const profileMediaQueryKeys = {
    all: ['profile-media'] as const,
    lists: () => [...profileMediaQueryKeys.all, 'list'] as const,
    list: (profileId: string, payload: Page<string>) => [...profileMediaQueryKeys.lists(), profileId, payload] as const,
};
