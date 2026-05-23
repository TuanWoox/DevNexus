"use client";

import { Calendar, FileText, HelpCircle } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { SelectPostDTO } from "@/types/post/select-post-dto";
import { CommunityApprovalStatus } from "@/types/enums/community-approval-status";
import { cn } from "@/lib/utils";

interface PendingPostHeaderProps {
    post: SelectPostDTO;
    isQuestion?: boolean;
}

export function PendingPostHeader({ post, isQuestion = false }: PendingPostHeaderProps) {
    const status = post.communityApprovalStatus ?? CommunityApprovalStatus.Pending;
    const isRejected = status === CommunityApprovalStatus.Rejected;
    const dateFormatted = new Date(post.dateCreated).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    // Helper for avatar initials fallback
    const authorName = post.author?.fullName ?? "Anonymous Author";

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-border/40 pb-4">
            <div className="flex items-start gap-3 min-w-0">
                <UserAvatar 
                    avatarUrl={post.author?.avatarUrl} 
                    fullName={authorName} 
                    size="lg" 
                    className="border border-border/40 shadow-sm" 
                />
                <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                        {isQuestion ? (
                            <span className="badge-cyan gap-1 py-0.5">
                                <HelpCircle className="h-3.5 w-3.5" />
                                Q&A Question
                            </span>
                        ) : (
                            <span className="badge-default gap-1 py-0.5">
                                <FileText className="h-3.5 w-3.5" />
                                Community Post
                            </span>
                        )}
                        <h2 className="text-lg font-semibold tracking-tight text-heading leading-tight truncate max-w-full">
                            {post.title}
                        </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium hover:text-foreground transition-colors">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            {authorName}
                        </span>
                        <span className="text-border/60">•</span>
                        <span className="flex items-center gap-1 font-medium">
                            <Calendar className="h-3 w-3" />
                            {dateFormatted}
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <span
                    className={cn(
                        "font-mono font-semibold tracking-wide uppercase px-2.5 py-1 text-2xs rounded-md shadow-sm border",
                        isRejected ? "badge-red" : "badge-amber"
                    )}
                >
                    {isRejected ? "Rejected" : "Pending Approval"}
                </span>
            </div>
        </div>
    );
}
