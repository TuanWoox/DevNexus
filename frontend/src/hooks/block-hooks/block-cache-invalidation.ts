import { InfiniteData, QueryClient } from "@tanstack/react-query";
import { answerQueryKeys } from "@/hooks/answer-hooks/use-answer-query-keys";
import { bookmarkQueryKeys } from "@/hooks/bookmark-hooks/use-bookmark-query-keys";
import { bookmarkedItemQueryKeys } from "@/hooks/bookmarked-item-hooks/use-bookmarked-item-query-keys";
import { commentQueryKeys } from "@/hooks/comment-hooks/use-comment-query-keys";
import { followRequestQueryKeys } from "@/hooks/follow-request-hooks/follow-request-query-keys";
import { postQueryKeys } from "@/hooks/post-hooks/use-post-query-keys";
import { qaPostQueryKeys } from "@/hooks/qa-post-hooks/use-qa-post-query-key";
import { recommendationQueryKeys } from "@/hooks/recommendation-hooks/use-recommendation-query-keys";
import { searchQueryKeys } from "@/hooks/search-hooks/use-global-search";
import { userFollowQueryKeys } from "@/hooks/user-follow-hooks/use-user-follow-query-key";
import { notificationQueryKeys } from "@/features/notifications/hooks/notification-query-keys";
import { PagedData } from "@/types/common/paged-data";
import { SelectUserFollowDTO } from "@/types/user-follow/select-user-follow-dto";
import { blockQueryKeys } from "./use-block-query-keys";

export function invalidateAfterBlockChange(queryClient: QueryClient, otherProfileId: string) {
    removeBlockedProfileFromFollowCaches(queryClient, otherProfileId);

    queryClient.invalidateQueries({ queryKey: ["profile", otherProfileId] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: blockQueryKeys.status(otherProfileId) });
    queryClient.invalidateQueries({ queryKey: blockQueryKeys.all });

    queryClient.invalidateQueries({ queryKey: postQueryKeys.all });
    queryClient.invalidateQueries({ queryKey: qaPostQueryKeys.all });
    queryClient.invalidateQueries({ queryKey: recommendationQueryKeys.all });
    queryClient.invalidateQueries({ queryKey: searchQueryKeys.all });
    queryClient.invalidateQueries({ queryKey: commentQueryKeys.all });
    queryClient.invalidateQueries({ queryKey: answerQueryKeys.all });
    queryClient.invalidateQueries({ queryKey: userFollowQueryKeys.all });
    queryClient.invalidateQueries({ queryKey: followRequestQueryKeys.all });
    queryClient.invalidateQueries({ queryKey: bookmarkQueryKeys.all });
    queryClient.invalidateQueries({ queryKey: bookmarkedItemQueryKeys.all });
    queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
}

function removeBlockedProfileFromFollowCaches(queryClient: QueryClient, blockedProfileId: string) {
    queryClient.setQueriesData<InfiniteData<PagedData<SelectUserFollowDTO, string>>>(
        { queryKey: userFollowQueryKeys.lists() },
        (old) => {
            if (!old) return old;

            return {
                ...old,
                pages: old.pages.map((page) => {
                    const data = page.data.filter(
                        (follow) =>
                            follow.ownerId !== blockedProfileId &&
                            follow.followingProfileId !== blockedProfileId
                    );
                    const removedCount = page.data.length - data.length;

                    return {
                        ...page,
                        data,
                        page: {
                            ...page.page,
                            totalElements: Math.max((page.page.totalElements ?? data.length) - removedCount, 0),
                        },
                    };
                }),
            };
        }
    );
}
