export const communityReportQueryKeys = {
    all: ['community-reports'] as const,
    lists: () => [...communityReportQueryKeys.all, 'list'] as const,
    list: (communityId: string, isModerator: boolean, contentType: number, filters: unknown) => 
        [...communityReportQueryKeys.lists(), communityId, { isModerator, contentType, filters }] as const,
};
