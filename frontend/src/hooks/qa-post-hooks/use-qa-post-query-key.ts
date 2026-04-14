export const qaPostQueryKeys = {
    all: ['qa-posts'] as const,
    lists: () => [...qaPostQueryKeys.all, 'list'] as const,
    list: (filters: unknown) => [...qaPostQueryKeys.lists(), { filters }] as const,
    details: () => [...qaPostQueryKeys.all, 'detail'] as const,
    detail: (id: string) => [...qaPostQueryKeys.details(), id] as const,
};
