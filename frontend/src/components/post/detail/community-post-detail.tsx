"use client";

import PostArticle from "@/components/post/post-article";
import CommentSection from "@/components/post/comment-section";
import PostNotFound from "@/components/post/post-not-found";
import { useGetPostById } from "@/hooks/post-hooks";

interface CommunityPostDetailProps {
    communityId: string;
    postId: string;
}

export function CommunityPostDetail({ communityId, postId }: CommunityPostDetailProps) {
    const { data: post, isLoading, isError, error } = useGetPostById(postId);

    if (isError) {
        const status = (error as any)?.response?.status;
        return <PostNotFound isForbidden={status === 401 || status === 403} />;
    }

    if (!isLoading && (!post || post.communityId !== communityId)) {
        return <PostNotFound message="This post does not belong to the requested community." />;
    }

    return (
        <div className="w-full mx-auto pb-8">
            <PostArticle postId={postId} isQAPost={false} context="community" routeCommunityId={communityId} />
            <CommentSection postId={postId} isQAPost={false} context="community" routeCommunityId={communityId} />
        </div>
    );
}
