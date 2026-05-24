"use client";

import PostArticle from "@/components/post/post-article";
import CommentSection from "@/components/post/comment-section";
import PostNotFound from "@/components/post/post-not-found";
import { useGetQAPostById } from "@/hooks/qa-post-hooks/use-get-qa-post-by-id";

interface CommunityQAPostDetailProps {
    communityId: string;
    qaPostId: string;
}

export function CommunityQAPostDetail({ communityId, qaPostId }: CommunityQAPostDetailProps) {
    const { data: qaPost, isLoading, isError, error } = useGetQAPostById(qaPostId);

    if (isError) {
        const status = (error as any)?.response?.status;
        return <PostNotFound isForbidden={status === 401 || status === 403} />;
    }

    if (!isLoading && (!qaPost || qaPost.communityId !== communityId)) {
        return <PostNotFound message="This question does not belong to the requested community." />;
    }

    return (
        <div className="w-full mx-auto pb-8">
            <PostArticle postId={qaPostId} isQAPost={true} context="community" routeCommunityId={communityId} />
            <CommentSection postId={qaPostId} isQAPost={true} context="community" routeCommunityId={communityId} />
        </div>
    );
}
