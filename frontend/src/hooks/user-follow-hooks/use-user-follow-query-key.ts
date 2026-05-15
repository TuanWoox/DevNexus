export const userFollowQueryKeys = {
    all: ['userFollows'] as const,
    lists: () => [...userFollowQueryKeys.all, 'list'] as const,
    list: (filters: unknown) => [...userFollowQueryKeys.lists(), { filters }] as const
};
