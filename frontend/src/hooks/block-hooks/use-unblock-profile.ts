"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { blockService } from "@/services/block-service";
import { toast } from "sonner";

export function useUnblockProfile(blockId: string | null, otherProfileId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => blockService.unblockProfile(blockId!),
        onSuccess: (data) => {
            if (data.message) {
                toast.error(data.message);
            } else {
                queryClient.invalidateQueries({ queryKey: ["blockStatus", otherProfileId] });
            }
        },
    });
}
