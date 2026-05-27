"use client";

import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { profileCommunityBlockService } from "@/services/profile-community-block-service";
import { PagedData } from "@/types/common/paged-data";
import { ReturnResult } from "@/types/common/return-result";
import { SelectCommunityDTO } from "@/types/community/select-community-dto";
import { SelectProfileCommunityBlockDTO } from "@/types/profile-community-block/select-profile-community-block-dto";
import { invalidateAfterCommunityBlockChange } from "./community-block-cache-invalidation";
import { profileCommunityBlockQueryKeys } from "./use-profile-community-block-query-keys";

export const communityBlockIdOf = (block: SelectProfileCommunityBlockDTO) => block.id ?? "";
export const blockedCommunityIdOf = (block: SelectProfileCommunityBlockDTO) => block.communityId ?? "";
export const blockedCommunityOf = (block: SelectProfileCommunityBlockDTO): SelectCommunityDTO | null =>
    block.community ?? null;

export type UnblockCommunityVariables = {
    blockId: string;
    communityId: string;
};

export function useUnblockCommunity() {
    const queryClient = useQueryClient();

    return useMutation<ReturnResult<boolean>, Error, UnblockCommunityVariables>({
        mutationFn: ({ blockId }) => {
            if (!blockId) throw new Error("Community block ID is required for unblocking");
            return profileCommunityBlockService.unblockCommunity(blockId);
        },
        onSuccess: (data, variables) => {
            if (data.result !== true) return;

            queryClient.setQueriesData<InfiniteData<PagedData<SelectProfileCommunityBlockDTO, string>>>(
                { queryKey: profileCommunityBlockQueryKeys.lists() },
                (old) => {
                    if (!old) return old;

                    return {
                        ...old,
                        pages: old.pages.map((page) => {
                            const filteredData = page.data.filter(
                                (item) => communityBlockIdOf(item) !== variables.blockId
                            );
                            const removedCount = page.data.length - filteredData.length;

                            return {
                                ...page,
                                data: filteredData,
                                page: {
                                    ...page.page,
                                    totalElements: Math.max(
                                        (page.page.totalElements ?? filteredData.length) - removedCount,
                                        0
                                    ),
                                },
                            };
                        }),
                    };
                }
            );

            invalidateAfterCommunityBlockChange(queryClient, variables.communityId);
            toast.success("Community unblocked");
        },
    });
}
