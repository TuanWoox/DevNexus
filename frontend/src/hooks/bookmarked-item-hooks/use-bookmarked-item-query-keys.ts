export const bookmarkedItemQueryKeys = {
    all: ['bookmarked-items'] as const,
    lists: () => [...bookmarkedItemQueryKeys.all, 'list'] as const,
    list: (filters: unknown) => [...bookmarkedItemQueryKeys.lists(), { filters }] as const,
    details: () => [...bookmarkedItemQueryKeys.all, 'detail'] as const,
    detail: (id: string) => [...bookmarkedItemQueryKeys.details(), id] as const,
};
