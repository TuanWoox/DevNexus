export const profileCommunityBlockQueryKeys = {
    all: ["profileCommunityBlocks"] as const,
    lists: () => [...profileCommunityBlockQueryKeys.all, "list"] as const,
    mine: (searchTerm: string = "") => [...profileCommunityBlockQueryKeys.lists(), "mine", searchTerm] as const,
};
