"use client";

import { useEffect, useMemo, useRef } from "react";
import { FEED_BASE_PAYLOAD } from "@/constants/feed-payload";
import { useGetRecommendedPostsInfinite } from "@/hooks/recommendation-hooks/use-get-recommended-posts-infinite";
import { useTrackRecommendationInteraction } from "@/hooks/recommendation-hooks/use-track-recommendation-interaction";
import { PostListView } from "./post-list-view";

const STALE_TIME = 5 * 60 * 1000;

export function InfiniteRecommendedPostList() {
    const seenPostIds = useRef(new Set<string>());
    const trackInteraction = useTrackRecommendationInteraction();
    const {
        data,
        isLoading,
        isError,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useGetRecommendedPostsInfinite(FEED_BASE_PAYLOAD, STALE_TIME);

    const posts = useMemo(
        () => data?.pages.flatMap((page) => page?.data ?? []),
        [data]
    );

    useEffect(() => {
        posts?.forEach((post) => {
            if (!post.id || seenPostIds.current.has(post.id)) return;

            seenPostIds.current.add(post.id);
            trackInteraction.mutate({
                postId: post.id,
                interactionType: "view",
                source: "recommendation",
            });
        });
    }, [posts, trackInteraction]);

    return (
        <PostListView
            title="For You"
            subtitle="Recommended discussions based on your activity."
            posts={posts}
            isLoading={isLoading}
            isError={isError}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            onLoadMore={fetchNextPage}
            loadingText="Loading recommendations..."
            emptyTitle="No recommendations yet"
            emptySubtitle="Explore posts, tags, and communities to shape your feed."
            isRecommendation={true}
        />
    );
}
