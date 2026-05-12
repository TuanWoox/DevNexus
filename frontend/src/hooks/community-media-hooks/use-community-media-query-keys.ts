import { Page } from "@/types/common/page";

export const communityMediaQueryKeys = {
    all: ['community-media'] as const,
    lists: () => [...communityMediaQueryKeys.all, 'list'] as const,
    list: (communityId: string, payload: Page<string>) => [...communityMediaQueryKeys.lists(), communityId, payload] as const,
};
