export const postQueryKeys = {
    all: ['posts'] as const,
    lists: () => [...postQueryKeys.all, 'list'] as const,
    list: (filters: unknown) => [...postQueryKeys.lists(), { filters }] as const,
    details: () => [...postQueryKeys.all, 'detail'] as const,
    detail: (id: string) => [...postQueryKeys.details(), id] as const,
};
