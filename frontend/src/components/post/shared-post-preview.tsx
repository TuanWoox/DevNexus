"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FileQuestion, FileText, Lock, Globe } from "lucide-react";
import { SelectPostDTO, SharedContentType } from "@/types/post/select-post-dto";
import { getSharedPostDetailHref } from "@/utils/content-routes";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ProfileHoverCard } from "@/components/profile/profile-hover-card";
import { ProfileHoverCardAuthor } from "@/components/profile/profile-hover-card-content";
import { MarkdownViewer } from "@/components/editor/markdown-viewer";
import { cn } from "@/lib/utils";

interface SharedPostPreviewProps {
    post: SelectPostDTO;
}

export function SharedPostPreview({ post }: SharedPostPreviewProps) {
    const router = useRouter();
    const [isContentExpanded, setIsContentExpanded] = useState(false);

    if (!post.sharedPostId) return null;

    if (!post.sharedPost) {
        return (
            <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground shadow-2xs">
                <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground/75" />
                    <span>This post is not available.</span>
                </div>
            </div>
        );
    }

    const isQa = post.sharedPost.contentType === SharedContentType.QAPost;
    const Icon = isQa ? FileQuestion : FileText;
    const sharedAuthor = post.sharedPost.author;
    const sharedCommunity = post.sharedPost.community;

    const formattedDate = new Date(post.sharedPost.dateCreated).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });

    const handleCardClick = (e: React.MouseEvent) => {
        // Prevent clicking the outer shared post detail page link
        e.preventDefault();
        e.stopPropagation();
        router.push(getSharedPostDetailHref(post.sharedPost!));
    };

    const hasLongContent = post.sharedPost.contentPreview && post.sharedPost.contentPreview.length > 250;

    return (
        <div className="relative group/shared mt-1">
            <div
                onClick={handleCardClick}
                className="block cursor-pointer rounded-xl border border-border/80 bg-card/65 hover:bg-card/95 hover:border-primary/25 shadow-3xs hover:shadow-2xs transition-all duration-300 p-4 sm:p-5"
            >
                {/* Facebook-style Header section */}
                <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-border/40">
                    <div className="flex items-center gap-3 min-w-0">
                        {sharedCommunity ? (
                            /* Community Post Header Style */
                            <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                <Link
                                    href={`/communities/${sharedCommunity.id}`}
                                    className="block w-9 h-9 rounded-lg overflow-hidden border border-default bg-primary/10 relative"
                                >
                                    {sharedCommunity.communityCoverPhotoUrl ? (
                                        <Image
                                            src={sharedCommunity.communityCoverPhotoUrl}
                                            alt={sharedCommunity.name}
                                            fill
                                            unoptimized
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <Globe className="w-4 h-4 text-primary" />
                                        </div>
                                    )}
                                </Link>
                                {sharedAuthor && (
                                    <ProfileHoverCard
                                        profileId={sharedAuthor.id}
                                        author={sharedAuthor as ProfileHoverCardAuthor}
                                        communityId={sharedCommunity.id}
                                        showCommunityStatus={true}
                                    >
                                        <Link
                                            href={`/profile/${sharedAuthor.id}`}
                                            className="absolute -bottom-1 -right-1 w-5.5 h-5.5 rounded-full border border-card bg-page overflow-hidden"
                                        >
                                            <UserAvatar
                                                avatarUrl={sharedAuthor.avatarUrl}
                                                fullName={sharedAuthor.fullName}
                                                className="h-full w-full border-0"
                                            />
                                        </Link>
                                    </ProfileHoverCard>
                                )}
                            </div>
                        ) : (
                            /* Standard Profile Post Header Style */
                            sharedAuthor && (
                                <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                                    <ProfileHoverCard
                                        profileId={sharedAuthor.id}
                                        author={sharedAuthor as ProfileHoverCardAuthor}
                                    >
                                        <Link
                                            href={`/profile/${sharedAuthor.id}`}
                                            className="block w-9 h-9 rounded-full bg-primary/20 overflow-hidden border border-default relative"
                                        >
                                            <UserAvatar
                                                avatarUrl={sharedAuthor.avatarUrl}
                                                fullName={sharedAuthor.fullName}
                                                className="h-full w-full border-0"
                                            />
                                        </Link>
                                    </ProfileHoverCard>
                                </div>
                            )
                        )}

                        <div className="flex min-w-0 flex-col">
                            {sharedCommunity ? (
                                <>
                                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                        <Link
                                            href={`/communities/${sharedCommunity.id}`}
                                            className="text-[13px] font-bold text-heading hover:underline hover:text-primary transition-colors truncate max-w-[150px] sm:max-w-[200px]"
                                        >
                                            {sharedCommunity.name}
                                        </Link>
                                    </div>
                                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                                        {sharedAuthor && (
                                            <span onClick={(e) => e.stopPropagation()}>
                                                <ProfileHoverCard
                                                    profileId={sharedAuthor.id}
                                                    author={sharedAuthor as ProfileHoverCardAuthor}
                                                    communityId={sharedCommunity.id}
                                                    showCommunityStatus={true}
                                                >
                                                    <Link
                                                        href={`/profile/${sharedAuthor.id}`}
                                                        className="font-semibold hover:underline text-muted-foreground transition-colors truncate hover:text-primary"
                                                    >
                                                        {sharedAuthor.fullName}
                                                    </Link>
                                                </ProfileHoverCard>
                                            </span>
                                        )}
                                        <span>•</span>
                                        <span suppressHydrationWarning>{formattedDate}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {sharedAuthor && (
                                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                            <ProfileHoverCard
                                                profileId={sharedAuthor.id}
                                                author={sharedAuthor as ProfileHoverCardAuthor}
                                            >
                                                <Link
                                                    href={`/profile/${sharedAuthor.id}`}
                                                    className="text-[13px] font-bold text-heading hover:text-primary hover:underline transition-colors truncate"
                                                >
                                                    {sharedAuthor.fullName}
                                                </Link>
                                            </ProfileHoverCard>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <span className="text-[11px] font-semibold text-muted-foreground" suppressHydrationWarning>{formattedDate}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[9px] font-bold text-muted-foreground">
                        <Icon className="h-3 w-3" />
                        <span>{isQa ? "Q&A" : "Post"}</span>
                    </div>
                </div>

                {/* Content section */}
                <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-extrabold leading-snug text-heading group-hover/shared:text-primary transition-colors tracking-tight">
                        {post.sharedPost.title}
                    </h3>

                    {post.sharedPost.contentPreview && (
                        <div className="relative overflow-hidden transition-all duration-300 mt-1">
                            <div className={cn(
                                "text-xs leading-relaxed text-muted-foreground/90 transition-all duration-300 font-normal",
                                !isContentExpanded && hasLongContent && "line-clamp-3 max-h-[54px]"
                            )}>
                                <MarkdownViewer source={post.sharedPost.contentPreview} />
                            </div>

                            {!isContentExpanded && hasLongContent && (
                                <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-card via-card/50 to-transparent pointer-events-none" />
                            )}
                        </div>
                    )}

                    {hasLongContent && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsContentExpanded(!isContentExpanded);
                            }}
                            className="relative z-20 mt-1 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0 self-start"
                        >
                            {isContentExpanded ? "Show less" : "See more"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
