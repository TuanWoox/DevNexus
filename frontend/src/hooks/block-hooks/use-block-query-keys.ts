export const blockQueryKeys = {
    all: ["profileBlocks"] as const,
    lists: () => [...blockQueryKeys.all, "list"] as const,
    mine: (searchTerm: string = "") => [...blockQueryKeys.lists(), "mine", searchTerm] as const,
    status: (profileId: string | null) => ["blockStatus", profileId] as const,
};
