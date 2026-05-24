"use client";

import PostArticle from "@/components/post/post-article";
import CommentSection from "@/components/post/comment-section";

interface PersonalQAPostDetailProps {
    qaPostId: string;
}

export function PersonalQAPostDetail({ qaPostId }: PersonalQAPostDetailProps) {
    return (
        <div className="w-full mx-auto pb-8">
            <PostArticle postId={qaPostId} isQAPost={true} context="personal" />
            <CommentSection postId={qaPostId} isQAPost={true} context="personal" />
        </div>
    );
}
