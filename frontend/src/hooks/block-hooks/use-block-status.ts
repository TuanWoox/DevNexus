"use client";

import { useQuery } from "@tanstack/react-query";
import { blockService } from "@/services/block-service";

export interface BlockStatus {
    iBlockedThem: boolean;
    blockId: string | null;
    theyBlockedMe: boolean;
}

export function useBlockStatus(otherProfileId: string | null) {
    return useQuery({
        queryKey: ["blockStatus", otherProfileId],
        queryFn: async (): Promise<BlockStatus> => {
            const blocks = await blockService.getMyBlocks();
            const myBlock = blocks.find((b) => b.BlockedProfileId === otherProfileId);
            return {
                iBlockedThem: !!myBlock,
                blockId: myBlock?.Id ?? null,
                theyBlockedMe: false, // updated in real-time via socket events
            };
        },
        enabled: !!otherProfileId,
        staleTime: 30_000,
    });
}
