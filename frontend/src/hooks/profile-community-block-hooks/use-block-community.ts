"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { profileCommunityBlockService } from "@/services/profile-community-block-service";
import { invalidateAfterCommunityBlockChange } from "./community-block-cache-invalidation";

type UseBlockCommunityOptions = {
    invalidationRefetchType?: "active" | "inactive" | "all" | "none";
};

export function useBlockCommunity(options: UseBlockCommunityOptions = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (communityId: string) => profileCommunityBlockService.blockCommunity(communityId),
        onSuccess: (data, communityId) => {
            if (data.result) {
                invalidateAfterCommunityBlockChange(queryClient, communityId, {
                    refetchType: options.invalidationRefetchType,
                });
                toast.success("Community blocked");
            }
        },
    });
}
