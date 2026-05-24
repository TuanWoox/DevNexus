"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SelectPostDTO } from "@/types/post/select-post-dto";
import { useApproveCommunityPost } from "@/hooks/post-hooks/use-approve-community-post";
import { useRejectCommunityPost } from "@/hooks/post-hooks/use-reject-community-post";
import { useApproveCommunityQAPost } from "@/hooks/qa-post-hooks/use-approve-community-qa-post";
import { useRejectCommunityQAPost } from "@/hooks/qa-post-hooks/use-reject-community-qa-post";
import { cn } from "@/lib/utils";

// Import modular sub-components
import { PendingPostHeader } from "./pending-post-header";
import { PendingPostContent } from "./pending-post-content";
import { PendingPostRejection } from "./pending-post-rejection";
import { PendingPostFooter } from "./pending-post-footer";

interface PendingPostCardProps {
    post: SelectPostDTO;
    isAuthor?: boolean;
    isModerator?: boolean;
    isQuestion?: boolean;
}

export function PendingPostCard({
    post,
    isAuthor = false,
    isModerator = false,
    isQuestion = false
}: PendingPostCardProps) {
    const approvePost = useApproveCommunityPost();
    const rejectPost = useRejectCommunityPost();
    const approveQuestion = useApproveCommunityQAPost();
    const rejectQuestion = useRejectCommunityQAPost();

    const isBusy =
        approvePost.isPending ||
        rejectPost.isPending ||
        approveQuestion.isPending ||
        rejectQuestion.isPending;

    const handleApprove = () => {
        if (isQuestion) {
            approveQuestion.mutate(post.id);
            return;
        }
        approvePost.mutate(post.id);
    };

    const handleReject = (reasonText: string, onSuccessCallback: () => void) => {
        const payload = { postId: post.id, reason: reasonText || undefined };
        if (isQuestion) {
            rejectQuestion.mutate(payload, { onSuccess: onSuccessCallback });
            return;
        }
        rejectPost.mutate(payload, { onSuccess: onSuccessCallback });
    };

    return (
        <Card
            className={cn(
                "card card-hover transition-all duration-300 relative overflow-hidden shadow-card hover:shadow-elevated",
                // Left vertical color accent strip to distinguish posts from questions instantly
                isQuestion 
                    ? "border-l-4 border-l-cyan-500/70 dark:border-l-cyan-500/50" 
                    : "border-l-4 border-l-primary/70 dark:border-l-primary/50"
            )}
        >
            <div className="p-5 sm:p-6 space-y-5">
                {/* 1. Header Area: Avatar, Meta Info, Tags, Post type, Status Badges */}
                <PendingPostHeader post={post} isQuestion={isQuestion} />

                {/* 2. Body Content Area: Title, Clampable text content, tags list */}
                <PendingPostContent content={post.content} tagNames={post.tagNames} />

                {/* 3. Rejection Area: Display feedback if rejected */}
                <PendingPostRejection reason={post.communityApprovalReason} />

                {/* 4. Actions Area: Direct moderation control for admins & mods */}
                {isModerator && !isAuthor && (
                    <PendingPostFooter
                        isBusy={isBusy}
                        onApprove={handleApprove}
                        onReject={handleReject}
                    />
                )}
            </div>
        </Card>
    );
}
