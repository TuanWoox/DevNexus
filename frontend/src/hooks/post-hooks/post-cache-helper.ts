import { InfiniteData, QueryClient } from "@tanstack/react-query";
import { postQueryKeys } from "@/hooks/post-hooks/use-post-query-keys";
import { qaPostQueryKeys } from "@/hooks/qa-post-hooks/use-qa-post-query-key";
import { PagedData } from "@/types/common/paged-data";
import { SelectPostDTO } from "@/types/post/select-post-dto";
import { SelectQAPostDTO } from "@/types/qa-post/select-qa-post-dto";
import { ModerationStatus, normalizeModerationStatus } from "@/types/post/moderation-status";

export type FeedPost = SelectPostDTO | SelectQAPostDTO;
type InfinitePosts = InfiniteData<PagedData<FeedPost, string>>;

function mapPostInPage(page: PagedData<FeedPost, string>, postId: string, status: ModerationStatus) {
    const normalizedStatus = normalizeModerationStatus(status);

    return {
        ...page,
        data: page.data.map((post) =>
            post.id === postId ? { ...post, moderationStatus: normalizedStatus } : post,
        ),
    };
}

export function replaceOptimisticPostInLists(
    queryClient: QueryClient,
    optimisticId: string,
    post: FeedPost,
) {
    queryClient.setQueriesData<InfinitePosts>({ queryKey: postQueryKeys.lists() }, (old) => {
        if (!old) return old;

        return {
            ...old,
            pages: old.pages.map((page) => ({
                ...page,
                data: page.data.map((item) => item.id === optimisticId ? post : item),
            })),
        };
    });
}

export function updatePostInCaches(queryClient: QueryClient, post: FeedPost) {
    const updateLists = (old: InfinitePosts | undefined) => {
        if (!old) return old;

        return {
            ...old,
            pages: old.pages.map((page) => ({
                ...page,
                data: page.data.map((item) => item.id === post.id ? post : item),
            })),
        };
    };

    queryClient.setQueriesData<InfinitePosts>({ queryKey: postQueryKeys.lists() }, updateLists);
    queryClient.setQueriesData<InfinitePosts>({ queryKey: qaPostQueryKeys.lists() }, updateLists);
    queryClient.setQueryData(postQueryKeys.detail(post.id), post);
    queryClient.setQueryData(qaPostQueryKeys.detail(post.id), post);
}

export function updatePostModerationStatusInCache(
    queryClient: QueryClient,
    postId: string,
    status: ModerationStatus,
) {
    const normalizedStatus = normalizeModerationStatus(status);

    queryClient.setQueriesData<InfinitePosts>({ queryKey: postQueryKeys.lists() }, (old) => {
        if (!old) return old;

        return {
            ...old,
            pages: old.pages.map((page) => mapPostInPage(page, postId, normalizedStatus)),
        };
    });

    queryClient.setQueriesData<InfinitePosts>({ queryKey: qaPostQueryKeys.lists() }, (old) => {
        if (!old) return old;

        return {
            ...old,
            pages: old.pages.map((page) => mapPostInPage(page, postId, normalizedStatus)),
        };
    });

    queryClient.setQueryData<FeedPost | undefined>(postQueryKeys.detail(postId), (old) =>
        old ? { ...old, moderationStatus: normalizedStatus } : old,
    );

    queryClient.setQueryData<FeedPost | undefined>(qaPostQueryKeys.detail(postId), (old) =>
        old ? { ...old, moderationStatus: normalizedStatus } : old,
    );
}

export function prependPostToInfiniteLists(queryClient: QueryClient, post: FeedPost) {
    queryClient.setQueriesData<InfinitePosts>({ queryKey: postQueryKeys.lists() }, (old) => {
        if (!old?.pages.length) return old;
        const [firstPage, ...restPages] = old.pages;

        return {
            ...old,
            pages: [
                {
                    ...firstPage,
                    data: [post, ...firstPage.data.filter((item) => item.id !== post.id)],
                },
                ...restPages,
            ],
        };
    });
}
