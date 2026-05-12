export const communityModeratorsQueryKeys = {
    all: ['community-moderators'] as const,
    lists: () => [...communityModeratorsQueryKeys.all, 'list'] as const,
    list: (communityId: string, filters: unknown) => [...communityModeratorsQueryKeys.lists(), communityId, { filters }] as const,
};
