export const communityBansQueryKeys = {
    all: ['community-bans'] as const,
    lists: () => [...communityBansQueryKeys.all, 'list'] as const,
    list: (communityId: string, filters: unknown) => [...communityBansQueryKeys.lists(), communityId, { filters }] as const,
};
