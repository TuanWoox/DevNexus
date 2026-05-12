export const communityQueryKeys = {
    all: ['communities'] as const,
    lists: () => [...communityQueryKeys.all, 'list'] as const,
    list: (filters: unknown) => [...communityQueryKeys.lists(), { filters }] as const,
    details: () => [...communityQueryKeys.all, 'detail'] as const,
    detail: (id: string) => [...communityQueryKeys.details(), id] as const,
};
