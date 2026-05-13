export const bookmarkQueryKeys = {
    all: ['bookmarks'] as const,
    lists: () => [...bookmarkQueryKeys.all, 'list'] as const,
    list: (filters: unknown) => [...bookmarkQueryKeys.lists(), { filters }] as const,
    details: () => [...bookmarkQueryKeys.all, 'detail'] as const,
    detail: (id: string) => [...bookmarkQueryKeys.details(), id] as const,
};
