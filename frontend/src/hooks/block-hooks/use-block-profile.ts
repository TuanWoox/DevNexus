"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { blockService } from "@/services/block-service";
import { toast } from "sonner";

export function useBlockProfile(otherProfileId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => blockService.blockProfile(otherProfileId),
        onSuccess: (data) => {
            if (data.message) {
                toast.error(data.message);
            } else {
                queryClient.invalidateQueries({ queryKey: ["blockStatus", otherProfileId] });
            }
        },
    });
}
