"use client";

import { useEffect, useMemo, useRef } from "react";
import { QUESTIONS_BASE_PAYLOAD } from "@/constants/feed-payload";
import { useGetRecommendedQAPostsInfinite } from "@/hooks/recommendation-hooks/use-get-recommended-qa-posts-infinite";
import { useTrackRecommendationInteraction } from "@/hooks/recommendation-hooks/use-track-recommendation-interaction";
import { PostListView } from "./post-list-view";

const STALE_TIME = 5 * 60 * 1000;

export function InfiniteRecommendedQAPostList() {
    const seenPostIds = useRef(new Set<string>());
    const trackInteraction = useTrackRecommendationInteraction();
    const {
        data,
        isLoading,
        isError,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useGetRecommendedQAPostsInfinite(QUESTIONS_BASE_PAYLOAD, STALE_TIME);

    const posts = useMemo(
        () => data?.pages.flatMap((page) => page?.data ?? []),
        [data]
    );

    useEffect(() => {
        posts?.forEach((post) => {
            if (!post.id || seenPostIds.current.has(post.id)) return;

            seenPostIds.current.add(post.id);
            trackInteraction.mutate({
                qaPostId: post.id,
                interactionType: "view",
                source: "recommendation",
            });
        });
    }, [posts, trackInteraction]);

    return (
        <PostListView
            title="Questions For You"
            subtitle="Recommended Q&A based on your activity."
            posts={posts}
            isLoading={isLoading}
            isError={isError}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            onLoadMore={fetchNextPage}
            loadingText="Loading recommended Q&A..."
            errorText="Failed to load recommended Q&A. Please try again."
            emptyTitle="No Q&A recommendations yet"
            emptySubtitle="Read and answer questions to shape your recommendations."
        />
    );
}
