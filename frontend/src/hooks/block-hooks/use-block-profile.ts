"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { blockService } from "@/services/block-service";
import { toast } from "sonner";
import { invalidateAfterBlockChange } from "./block-cache-invalidation";

export function useBlockProfile(otherProfileId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => blockService.blockProfile(otherProfileId),
        onSuccess: (data) => {
            if (data) {
                invalidateAfterBlockChange(queryClient, otherProfileId);
                toast.success("Profile blocked");
            }
        },
    });
}
