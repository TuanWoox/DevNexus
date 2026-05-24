"use client";

import { useQuery } from "@tanstack/react-query";
import { blockService } from "@/services/block-service";
import { blockQueryKeys } from "./use-block-query-keys";

export function useBlockStatus(otherProfileId: string | null, enabled = true) {
    return useQuery({
        queryKey: blockQueryKeys.status(otherProfileId),
        queryFn: () => blockService.getBlockStatus(otherProfileId!),
        enabled: enabled && !!otherProfileId,
        staleTime: 30_000,
    });
}
