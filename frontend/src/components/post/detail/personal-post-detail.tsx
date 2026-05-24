"use client";

import PostArticle from "@/components/post/post-article";
import CommentSection from "@/components/post/comment-section";

interface PersonalPostDetailProps {
    postId: string;
}

export function PersonalPostDetail({ postId }: PersonalPostDetailProps) {
    return (
        <div className="w-full mx-auto pb-8">
            <PostArticle postId={postId} isQAPost={false} context="personal" />
            <CommentSection postId={postId} isQAPost={false} context="personal" />
        </div>
    );
}
