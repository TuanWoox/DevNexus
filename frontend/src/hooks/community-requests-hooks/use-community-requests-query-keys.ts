export const communityRequestsQueryKeys = {
    all: ['community-requests'] as const,
    lists: () => [...communityRequestsQueryKeys.all, 'list'] as const,
    list: (communityId: string, filters: unknown) => [...communityRequestsQueryKeys.lists(), communityId, { filters }] as const,
};
