export const communityMuteQueryKeys = {
    all: ["community-mute"] as const,
    status: (communityId: string) => [...communityMuteQueryKeys.all, "status", communityId] as const,
};
