export const recommendationQueryKeys = {
    all: ['recommendations'] as const,
    postFeed: (filters: unknown) => [...recommendationQueryKeys.all, 'posts', { filters }] as const,
    qaFeed: (filters: unknown) => [...recommendationQueryKeys.all, 'qaposts', { filters }] as const,
    communityFeed: (filters: unknown) => [...recommendationQueryKeys.all, 'communities', { filters }] as const,
    trendingPosts: (period: string, limit: number) => [...recommendationQueryKeys.all, 'trending-posts', period, limit] as const,
    trendingCommunities: (period: string, limit: number) => [...recommendationQueryKeys.all, 'trending-communities', period, limit] as const,
};
