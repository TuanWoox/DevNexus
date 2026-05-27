"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { communityQueryKeys } from "@/hooks/community-hooks/use-community-query-key";
import { communityMembersQueryKeys } from "@/hooks/community-members-hooks/use-community-members-query-keys";
import { postQueryKeys } from "@/hooks/post-hooks/use-post-query-keys";
import { qaPostQueryKeys } from "@/hooks/qa-post-hooks/use-qa-post-query-key";
import { searchQueryKeys } from "@/hooks/search-hooks/use-global-search";
import { profileCommunityBlockService } from "@/services/profile-community-block-service";
import { profileCommunityBlockQueryKeys } from "./use-profile-community-block-query-keys";

export function useBlockCommunity() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (communityId: string) => profileCommunityBlockService.blockCommunity(communityId),
        onSuccess: (data, communityId) => {
            if (data.result) {
                queryClient.invalidateQueries({ queryKey: profileCommunityBlockQueryKeys.all });
                queryClient.invalidateQueries({ queryKey: communityQueryKeys.detail(communityId) });
                queryClient.invalidateQueries({ queryKey: communityQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: communityMembersQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: communityMembersQueryKeys.myRole(communityId) });
                queryClient.invalidateQueries({ queryKey: postQueryKeys.all });
                queryClient.invalidateQueries({ queryKey: qaPostQueryKeys.all });
                queryClient.invalidateQueries({ queryKey: searchQueryKeys.all });
                toast.success("Community blocked");
                return;
            }
        },
    });
}
