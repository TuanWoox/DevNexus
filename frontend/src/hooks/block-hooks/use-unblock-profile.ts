"use client";

import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { blockService } from "@/services/block-service";
import { toast } from "sonner";
import { PagedData } from "@/types/common/paged-data";
import { ReturnResult } from "@/types/common/return-result";
import { invalidateAfterBlockChange } from "./block-cache-invalidation";
import { blockQueryKeys } from "./use-block-query-keys";
import { SelectProfileBlockDTO } from "@/types/profile-block/select-profile-block-dto";

export const blockIdOf = (block: SelectProfileBlockDTO) => block.Id ?? block.id ?? "";
export const blockedProfileIdOf = (block: SelectProfileBlockDTO) => block.BlockedProfileId ?? block.blockedProfileId ?? "";

export type UnblockProfileVariables = {
    blockId: string;
    blockedProfileId: string;
};

export function useUnblockProfile(blockId?: string | null, otherProfileId?: string) {
    const queryClient = useQueryClient();

    return useMutation<ReturnResult<boolean>, Error, UnblockProfileVariables | void>({
        mutationFn: (variables?: UnblockProfileVariables | void) => {
            const finalBlockId = (variables && 'blockId' in variables) ? variables.blockId : blockId;
            if (!finalBlockId) throw new Error("Block ID is required for unblocking");
            return blockService.unblockProfile(finalBlockId);
        },
        onSuccess: (data, variables) => {
            if (data) {
                const finalBlockId = (variables && 'blockId' in variables) ? variables.blockId : blockId;
                const finalProfileId = (variables && 'blockedProfileId' in variables) ? variables.blockedProfileId : otherProfileId;

                // Optimistic update of the block lists if we unblocked a profile block
                if (finalBlockId) {
                    queryClient.setQueriesData<InfiniteData<PagedData<SelectProfileBlockDTO, string>>>(
                        { queryKey: blockQueryKeys.lists() },
                        (old) => {
                            if (!old) return old;

                            return {
                                ...old,
                                pages: old.pages.map((page) => ({
                                    ...page,
                                    data: page.data.filter((item) => blockIdOf(item) !== finalBlockId),
                                    page: {
                                        ...page.page,
                                        totalElements: Math.max((page.page.totalElements ?? 1) - 1, 0),
                                    },
                                })),
                            };
                        }
                    );
                }

                if (finalProfileId) {
                    invalidateAfterBlockChange(queryClient, finalProfileId);
                }

                toast.success("Profile unblocked");
            }
        },
    });
}
