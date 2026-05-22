export const communityMuteQueryKeys = {
    all: ["community-mute"] as const,
    status: (communityId: string) => [...communityMuteQueryKeys.all, "status", communityId] as const,
    profileStatus: (communityId: string, profileId: string) =>
        [...communityMuteQueryKeys.all, "profile-status", communityId, profileId] as const,
    lists: () => [...communityMuteQueryKeys.all, "list"] as const,
    list: (communityId: string, filters: unknown) => [...communityMuteQueryKeys.lists(), communityId, { filters }] as const,
};
