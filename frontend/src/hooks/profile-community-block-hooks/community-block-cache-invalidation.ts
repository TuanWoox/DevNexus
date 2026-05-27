import { QueryClient } from "@tanstack/react-query";
import { communityMembersQueryKeys } from "@/hooks/community-members-hooks/use-community-members-query-keys";
import { communityQueryKeys } from "@/hooks/community-hooks/use-community-query-key";
import { postQueryKeys } from "@/hooks/post-hooks/use-post-query-keys";
import { qaPostQueryKeys } from "@/hooks/qa-post-hooks/use-qa-post-query-key";
import { searchQueryKeys } from "@/hooks/search-hooks/use-global-search";
import { profileCommunityBlockQueryKeys } from "./use-profile-community-block-query-keys";

type CommunityBlockInvalidationOptions = {
    refetchType?: "active" | "inactive" | "all" | "none";
};

export function invalidateAfterCommunityBlockChange(
    queryClient: QueryClient,
    communityId: string,
    options: CommunityBlockInvalidationOptions = {}
) {
    const { refetchType } = options;

    queryClient.invalidateQueries({ queryKey: profileCommunityBlockQueryKeys.all, refetchType });
    queryClient.invalidateQueries({ queryKey: communityQueryKeys.detail(communityId), refetchType });
    queryClient.invalidateQueries({ queryKey: communityQueryKeys.lists(), refetchType });
    queryClient.invalidateQueries({ queryKey: communityMembersQueryKeys.lists(), refetchType });
    queryClient.invalidateQueries({ queryKey: communityMembersQueryKeys.myRole(communityId), refetchType });
    queryClient.invalidateQueries({ queryKey: postQueryKeys.all, refetchType });
    queryClient.invalidateQueries({ queryKey: qaPostQueryKeys.all, refetchType });
    queryClient.invalidateQueries({ queryKey: searchQueryKeys.all, refetchType });
}
