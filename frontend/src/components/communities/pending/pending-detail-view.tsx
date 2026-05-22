"use client";

import { useState, useEffect } from "react";
import { Check, ClipboardList, CornerDownRight, Loader2, MessageSquareText, Send, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SelectPostDTO } from "@/types/post/select-post-dto";
import { CommunityApprovalStatus } from "@/types/enums/community-approval-status";
import { PendingPostContent } from "./pending-post-content";
import { PendingPostRejection } from "./pending-post-rejection";
import { cn } from "@/lib/utils";

interface PendingDetailViewProps {
    post: SelectPostDTO | null;
    isModerator?: boolean;
    isAuthor?: boolean;
    isBusy: boolean;
    onApprove: () => void;
    onReject: (reason: string, onSuccess: () => void) => void;
    isQuestion?: boolean;
}

export function PendingDetailView({
    post,
    isModerator = false,
    isAuthor = false,
    isBusy,
    onApprove,
    onReject,
    isQuestion = false
}: PendingDetailViewProps) {
    const [showRejectEditor, setShowRejectEditor] = useState(false);
    const [reason, setReason] = useState("");

    // Reset local editor state when the selected post changes
    useEffect(() => {
        setShowRejectEditor(false);
        setReason("");
    }, [post?.id]);

    // 1. Empty Selection State
    if (!post) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-card/20">
                <ClipboardList className="size-12 text-muted-foreground/30 animate-pulse mb-3" />
                <h3 className="text-sm font-semibold text-heading">No Submission Selected</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Select a pending post or Q&A question from the sidebar list to inspect details and moderate.
                </p>
            </div>
        );
    }

    const dateFormatted = new Date(post.dateCreated).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

    const authorName = post.author?.fullName ?? "Anonymous";
    const initials = authorName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const status = post.communityApprovalStatus ?? CommunityApprovalStatus.Pending;
    const isRejected = status === CommunityApprovalStatus.Rejected;

    const handleConfirmReject = () => {
        if (!reason.trim()) return;
        onReject(reason.trim(), () => {
            setShowRejectEditor(false);
            setReason("");
        });
    };

    return (
        <div className="flex flex-col h-full bg-muted/15 border-l border-border/40">
            {/* 2. Scrollable Detail Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Header block: Title, Author Meta, Status Badging */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-border/40 pb-5">
                    <div className="flex items-start gap-4">
                        <Avatar size="lg" className="border border-border/40 shadow-sm shrink-0">
                            {post.author?.avatarUrl && (
                                <AvatarImage src={post.author.avatarUrl} alt={authorName} />
                            )}
                            <AvatarFallback className="font-semibold bg-primary/10 text-primary">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1.5">
                            <h2 className="text-xl font-bold tracking-tight text-heading leading-tight select-text">
                                {post.title}
                            </h2>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">{authorName}</span>
                                <span className="text-border/60">•</span>
                                <span className="font-medium">{dateFormatted}</span>
                            </div>
                        </div>
                    </div>
 
                    <div className="self-start sm:self-center shrink-0">
                        <span
                            className={cn(
                                "font-mono font-bold tracking-wide uppercase px-2.5 py-1 text-2xs rounded-md shadow-sm border select-none",
                                isRejected ? "badge-red" : "badge-amber"
                            )}
                        >
                            {isRejected ? "Rejected" : "Pending Moderation"}
                        </span>
                    </div>
                </div>
 
                {/* Body Content Description */}
                <div className="bg-card rounded-xl border border-border/50 p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-2xs font-semibold text-muted-foreground uppercase tracking-wider select-none border-b border-border/20 pb-2">
                        <CornerDownRight className="size-3" />
                        Submission Content
                    </div>
                    {/* Reuses our expandable Content view */}
                    <PendingPostContent content={post.content} tagNames={post.tagNames} />
                </div>

                {/* Display Rejection Reason if available */}
                <PendingPostRejection reason={post.communityApprovalReason} />
            </div>

            {/* 3. Sticky Action Workspace Footer (only for Moderators, and not their own post) */}
            {isModerator && !isAuthor && (
                <div className="border-t border-border/40 p-4 bg-card shrink-0 space-y-3">
                    
                    {/* Inline slide-open rejection feedback editor */}
                    {showRejectEditor && (
                        <div className="p-3.5 bg-muted/20 border border-destructive/20 rounded-xl space-y-2.5">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive uppercase tracking-wider">
                                <MessageSquareText className="size-4" />
                                Add Moderation Feedback
                            </div>
                            <Textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Explain why this content was rejected so the author can improve it..."
                                maxLength={1000}
                                rows={4}
                                className="text-xs resize-none rounded-lg border-border/60 bg-background/50 focus-visible:ring-destructive/30"
                            />
                            <div className="flex items-center justify-between">
                                <span className="text-2xs text-muted-foreground">
                                    {reason.length}/1000 chars
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowRejectEditor(false)}
                                        disabled={isBusy}
                                        className="h-8 text-xs font-medium"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleConfirmReject}
                                        disabled={isBusy || !reason.trim()}
                                        className="h-8 text-xs font-semibold flex items-center gap-1"
                                    >
                                        {isBusy ? (
                                            <Loader2 className="size-3 animate-spin" />
                                        ) : (
                                            <Send className="size-3" />
                                        )}
                                        Submit Rejection
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Standard Moderation Buttons */}
                    {!showRejectEditor && (
                        <div className="flex items-center justify-end gap-3">
                            <Button
                                variant="outline"
                                disabled={isBusy}
                                onClick={() => setShowRejectEditor(true)}
                                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all font-semibold flex items-center gap-1.5 h-9 rounded-lg px-4"
                            >
                                <X className="size-4" />
                                Reject Content
                            </Button>
                            <button
                                onClick={onApprove}
                                disabled={isBusy}
                                className="btn-emerald font-semibold flex items-center gap-1.5 h-9 shadow-md px-4"
                            >
                                {isBusy ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Check className="size-4" />
                                )}
                                Approve Publication
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
