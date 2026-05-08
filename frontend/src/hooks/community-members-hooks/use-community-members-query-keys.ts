export const communityMembersQueryKeys = {
    all: ['community-members'] as const,
    lists: () => [...communityMembersQueryKeys.all, 'list'] as const,
    list: (communityId: string, filters: unknown) => [...communityMembersQueryKeys.lists(), communityId, { filters }] as const,
    myRole: (communityId: string) => [...communityMembersQueryKeys.all, 'my-role', communityId] as const,
};
