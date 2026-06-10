'use client';

import { useState } from 'react';
import { Bookmark, Share2, MessageSquare, ArrowBigUp, ArrowBigDown, Globe, Code2, HelpCircle, History } from "lucide-react";
import { ModerationBanner } from "@/components/shared/moderation-banner";
import { SelectPostDTO } from "@/types/post/select-post-dto";
import Link from "next/link";
import Image from "next/image";
import { useUpdateVoteByPostId } from "@/hooks/vote-hooks/use-update-vote-by-post-id";
import { SelectQAPostDTO } from "@/types/qa-post/select-qa-post-dto";
import { MarkdownViewer } from "../editor/markdown-viewer";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { PostActionsDropdown } from "./post-actions-dropdown";
import { ProfileHoverCard } from "@/components/profile/profile-hover-card";
import { SaveBookmarkModal } from "../bookmark/save-bookmark-modal";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteBookmarkedItemById } from "@/hooks/bookmarked-item-hooks/use-delete-bookmarked-item-by-id";

import { useHasMounted } from "@/hooks/use-has-mounted";
import { cn } from "@/lib/utils";
import { normalizeModerationStatus, canInteractWithModeratedContent } from "@/types/post/moderation-status";
import { useMuteGuard } from "@/hooks/community-mute-hooks/use-mute-guard";
import { useGetCommunityById } from "@/hooks/community-hooks/use-get-community-by-id";
import { CommunityApprovalStatus, normalizeCommunityApprovalStatus } from "@/types/enums/community-approval-status";
import { getPostDetailHref, getQAPostDetailHref } from "@/utils/content-routes";
import { SharePostDialog } from "./share-post-dialog";
import { SharedPostPreview } from "./shared-post-preview";
import { CommunityHoverCard } from "@/components/communities/community-hover-card";
import { ContentHistoryOverlay } from "@/components/history/content-history-overlay";

interface PostCardProps {
    post: SelectPostDTO | SelectQAPostDTO;
    canModerateCommunity?: boolean;
    isRecommendation?: boolean;
}

export function PostCard({ post, canModerateCommunity, isRecommendation }: PostCardProps) {
    const hasMounted = useHasMounted();
    const { user } = useSelector((state: RootState) => state.auth);
    const isQaPost = 'answerCount' in post;
    const detailHref = isQaPost ? getQAPostDetailHref(post) : getPostDetailHref(post);
    const moderationStatus = normalizeModerationStatus(post.moderationStatus);
    const isFlagged = moderationStatus === "Flagged";
    const isModerationApproved = canInteractWithModeratedContent(moderationStatus);
    const communityApprovalStatus = normalizeCommunityApprovalStatus(post.communityApprovalStatus);
    const isCommunityApproved = !post.communityId ||
        communityApprovalStatus == null ||
        communityApprovalStatus === CommunityApprovalStatus.Approved;
    const isApproved = isModerationApproved && isCommunityApproved;
    const isCommunityPending = post.communityId && communityApprovalStatus === CommunityApprovalStatus.Pending;
    const isCommunityRejected = post.communityId && communityApprovalStatus === CommunityApprovalStatus.Rejected;

    const author = post.author;
    const community = (post as SelectPostDTO).community;
    const PostTypeIcon = isQaPost ? HelpCircle : Code2;
    // Auth state is client-side only (Redux), so we gate it with hasMounted to ensure 
    // the server and client initial render match perfectly.
    const isAuthor = hasMounted && user?.profileId === post.authorId;

    const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
    const [isUnsaveModalOpen, setIsUnsaveModalOpen] = useState(false);
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isContentExpanded, setIsContentExpanded] = useState(false);

    const { mutate: unsaveItem, isPending: isUnsavePending } = useDeleteBookmarkedItemById();
    const { mutate: updateVote, isPending: isVotePending } = useUpdateVoteByPostId(post.id);
    const { checkMuted } = useMuteGuard(post.communityId);
    const shouldFetchCommunityRole = Boolean(post.communityId) && canModerateCommunity === undefined;
    const { data: loadedCommunity } = useGetCommunityById(post.communityId ?? '', shouldFetchCommunityRole);
    const currentUserRole = loadedCommunity?.currentUserRole;
    const canModerateFromCard =
        currentUserRole === "OWNER" ||
        currentUserRole === "MODERATOR" ||
        currentUserRole === "Owner" ||
        currentUserRole === "Moderator";
    const canModerateContent = canModerateCommunity ?? canModerateFromCard;
    const canShare = isApproved && loadedCommunity?.isPrivate !== true;
    const hasHistory = (post.historyCount ?? 0) > 1;

    const handleSaveClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (post.isSaved && post.savedBookMarkedItemId) {
            setIsUnsaveModalOpen(true);
        } else {
            setIsBookmarkModalOpen(true);
        }
    };

    const confirmUnsave = () => {
        if (post.savedBookMarkedItemId) {
            unsaveItem(post.savedBookMarkedItemId);
        }
        setIsUnsaveModalOpen(false);
    };

    const handleVote = (e: React.MouseEvent, isUpvote: boolean) => {
        e.preventDefault();
        if (!isApproved) return;
        if (checkMuted('vote')) return;
        updateVote({ isUpvote });
    };

    const handleShareClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!canShare) return;
        setIsShareDialogOpen(true);
    };

    const handleHistoryClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isApproved || !hasHistory) return;
        setIsHistoryOpen(true);
    };

    // Note: Dates can cause hydration mismatches if server and client have different locales.
    // We use suppressHydrationWarning on the element where this is rendered.
    const formattedDate = new Date(post.dateModified).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });

    return (
        <article className={cn(
            "group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border/70 bg-card/95 p-4 text-card-foreground shadow-card backdrop-blur-sm transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-elevated sm:p-5",
            !isApproved && "border-dashed"
        )}>
            <ModerationBanner status={moderationStatus} reason={post.moderationReason} className="relative z-20" />
            {(isCommunityPending || isCommunityRejected) && (
                <div className={cn(
                    "relative z-20 rounded-lg border px-3 py-2 text-sm font-medium",
                    isCommunityRejected
                        ? "border-destructive/30 bg-destructive/10 text-destructive"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                )}>
                    {isCommunityRejected ? "Rejected by community moderators" : "Pending community approval"}
                    {post.communityApprovalReason ? `: ${post.communityApprovalReason}` : ""}
                </div>
            )}
            {/* Header: Community/Author & Options */}
            <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-3.5 mb-1.5">
                <div className="flex items-center gap-3 relative z-10">
                    {community ? (
                        /* Community Post Header Style */
                        <>
                            <div className="relative">
                                <CommunityHoverCard communityId={community.id} community={community} side="right">
                                    <Link href={`/communities/${community.id}`} className="relative isolate block size-10 shrink-0 overflow-hidden rounded-lg border border-default bg-primary/10">
                                        {community.communityCoverPhotoUrl ? (
                                            <img src={community.communityCoverPhotoUrl} alt={community.name} className="absolute left-1/2 top-1/2 h-[160%] w-full -translate-x-1/2 -translate-y-1/2 object-cover object-center" />
                                        ) : (
                                            <div className="flex size-full items-center justify-center">
                                                <Globe className="w-5 h-5 text-primary" />
                                            </div>
                                        )}
                                    </Link>
                                </CommunityHoverCard>
                                <ProfileHoverCard profileId={post.authorId} author={author} communityId={post.communityId} showCommunityStatus={Boolean(post.communityId)} canModerateCommunity={canModerateContent}>
                                    <Link href={`/profile/${post.authorId}`} className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-card bg-page overflow-hidden">
                                        <UserAvatar avatarUrl={author?.avatarUrl} fullName={author?.fullName} className="h-full w-full border-0" />
                                    </Link>
                                </ProfileHoverCard>
                            </div>
                            <div className="flex min-w-0 flex-col">
                                <div className="flex items-center gap-1.5">
                                    <CommunityHoverCard communityId={community.id} community={community} side="bottom">
                                        <Link href={`/communities/${community.id}`} className="text-sm font-bold text-heading hover:underline transition-colors truncate max-w-[150px] sm:max-w-[200px]">
                                            {community.name}
                                        </Link>
                                    </CommunityHoverCard>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                    <ProfileHoverCard profileId={post.authorId} author={author} communityId={post.communityId} showCommunityStatus={Boolean(post.communityId)} canModerateCommunity={canModerateContent}>
                                        <Link href={`/profile/${post.authorId}`} className="font-semibold hover:underline text-muted-foreground transition-colors truncate max-w-[100px]">
                                            {author?.fullName || 'Unknown'}
                                        </Link>
                                    </ProfileHoverCard>
                                    <span>•</span>
                                    <span suppressHydrationWarning>{formattedDate}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Standard Profile Post Header Style */
                        <>
                            <ProfileHoverCard profileId={post.authorId} author={author}>
                                <Link href={`/profile/${post.authorId}`} className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden border border-default relative">
                                    <UserAvatar avatarUrl={author?.avatarUrl} fullName={author?.fullName} className="h-full w-full border-0" />
                                </Link>
                            </ProfileHoverCard>
                            <div className="flex min-w-0 flex-col">
                                <ProfileHoverCard profileId={post.authorId} author={author}>
                                    <Link href={`/profile/${post.authorId}`} className="text-sm font-semibold text-heading hover:text-primary transition-colors">
                                        {author?.fullName || 'Unknown'}
                                    </Link>
                                </ProfileHoverCard>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-xs font-semibold text-muted-foreground" suppressHydrationWarning>{formattedDate}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="relative z-10 flex items-center gap-2">
                    <div className="hidden items-center gap-1.5 rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 font-semibold text-primary sm:flex">
                        <PostTypeIcon className="h-3.5 w-3.5" />
                        <span className="text-sm">{isQaPost ? 'Q&A' : 'Discussion'}</span>
                    </div>
                    <PostActionsDropdown
                        postId={post.id}
                        communityId={post.communityId}
                        isQAPost={isQaPost}
                        isAuthor={isAuthor}
                        canModerateCommunity={canModerateContent}
                        isRecommendation={isRecommendation}
                        isFlagged={isFlagged}
                        dropdownClassName="relative z-10"
                    />
                </div>
            </div>

            {/* Content Section */}
            <div className={cn(
                "relative z-10 flex flex-col gap-2",
                !isApproved && "opacity-70 grayscale-[20%]"
            )}>
                <Link href={detailHref} className="block after:absolute after:inset-0">
                    <h2 className="text-lg font-extrabold leading-snug text-heading transition-colors group-hover:text-primary sm:text-xl tracking-tight">
                        {post.title}
                    </h2>
                </Link>

                <div className="relative overflow-hidden transition-all duration-300 mt-1">
                    <div className={cn(
                        "text-sm leading-relaxed text-muted-foreground/90 transition-all duration-300 font-normal",
                        !isContentExpanded && post.content.length > 250 && "line-clamp-3 max-h-[72px]"
                    )}>
                        <MarkdownViewer source={post.content} />
                    </div>

                    {!isContentExpanded && post.content.length > 250 && (
                        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-card via-card/50 to-transparent pointer-events-none" />
                    )}
                </div>

                {post.content.length > 250 && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsContentExpanded(!isContentExpanded);
                        }}
                        className="relative z-20 mt-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0 self-start"
                    >
                        {isContentExpanded ? "Show less" : "See more"}
                    </button>
                )}
            </div>

            <SharedPostPreview post={post as SelectPostDTO} />

            {/* Tags */}
            {post.tagNames && post.tagNames.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {post.tagNames.slice(0, 5).map((tag) => (
                        <span key={tag} className="relative z-10 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/15 dark:text-emerald-300">
                            #{tag}
                        </span>
                    ))}
                    {post.tagNames.length > 5 && (
                        <span className="relative z-10 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                            +{post.tagNames.length - 5}
                        </span>
                    )}
                </div>
            )}

            {/* Interaction Actions */}
            <div className="relative z-10 flex items-center justify-between border-t border-border/70 pt-3">
                <div className="flex items-center gap-1 sm:gap-2">
                    <div className="relative z-10 flex items-center rounded-full border border-border/70 bg-muted/50 p-0.5 shadow-sm">
                        <button
                            onClick={(e) => handleVote(e, true)}
                            disabled={isVotePending || !isApproved}
                            className={cn(
                                "group flex items-center gap-1.5 rounded-full p-1.5 transition-colors hover:bg-background disabled:opacity-50 sm:p-2 cursor-pointer disabled:cursor-not-allowed",
                                post.currentUserVote === true
                                    ? "text-emerald-500"
                                    : "text-muted-foreground hover:text-emerald-500"
                            )}
                        >
                            <ArrowBigUp className={cn("w-5 h-5 transition-all", post.currentUserVote === true ? "fill-emerald-500" : "group-hover:fill-emerald-500/20")} />
                            <span className="text-sm font-medium pr-1">{post.upvoteCount}</span>
                        </button>
                        <div className="mx-0.5 h-5 w-px bg-border"></div>
                        <button
                            onClick={(e) => handleVote(e, false)}
                            disabled={isVotePending || !isApproved}
                            className={cn(
                                "group flex items-center gap-1.5 rounded-full p-1.5 transition-colors hover:bg-background disabled:opacity-50 sm:p-2 cursor-pointer disabled:cursor-not-allowed",
                                post.currentUserVote === false
                                    ? "text-rose-500"
                                    : "text-muted-foreground hover:text-rose-500"
                            )}
                        >
                            <span className="text-sm font-medium pr-1">{post.downvoteCount}</span>
                            <ArrowBigDown className={cn("w-5 h-5 transition-all", post.currentUserVote === false ? "fill-rose-500" : "group-hover:fill-rose-500/20")} />
                        </button>
                    </div>

                    {/* Comments/Answers — Link instead of button for right-click support */}
                    {isApproved ? (
                        <Link
                            href={detailHref}
                            className="relative z-10 flex items-center gap-2 rounded-full border border-transparent p-2 text-muted-foreground transition-colors hover:border-border hover:bg-muted/70 hover:text-heading sm:px-3 sm:py-2"
                        >
                            <MessageSquare className="w-5 h-5" />
                            <span className="text-sm font-medium">{isQaPost ? (post as SelectQAPostDTO).answerCount : post.commentCount}</span>
                            <span className="text-sm font-medium hidden sm:block">{isQaPost ? 'Answers' : 'Comments'}</span>
                        </Link>
                    ) : (
                        <div className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 cursor-not-allowed text-muted-foreground opacity-50 rounded-full sm:rounded-lg relative z-10" aria-disabled>
                            <MessageSquare className="w-5 h-5" />
                            <span className="text-sm font-medium">{isQaPost ? (post as SelectQAPostDTO).answerCount : post.commentCount}</span>
                            <span className="text-sm font-medium hidden sm:block">{isQaPost ? 'Answers' : 'Comments'}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                    <button
                        onClick={handleSaveClick}
                        disabled={!isApproved}
                        className={`relative z-10 flex items-center gap-2 rounded-full cursor-pointer disabled:cursor-not-allowed border border-transparent p-2 text-muted-foreground transition-colors hover:border-border hover:bg-muted/70 hover:text-heading disabled:opacity-50 sm:px-3 sm:py-2 ${post.isSaved ? 'text-heading hover:text-heading/80' : 'text-muted-foreground hover:text-heading'}`}
                    >
                        <Bookmark className={`w-5 h-5 ${post.isSaved ? 'fill-foreground text-heading' : ''}`} />
                        <span className="text-sm font-medium hidden sm:block">{post.isSaved ? 'Saved' : 'Save'}</span>
                    </button>
                    <button
                        onClick={handleShareClick}
                        disabled={!canShare}
                        className="relative z-10 flex items-center gap-2 rounded-full cursor-pointer disabled:cursor-not-allowed border border-transparent p-2 text-muted-foreground transition-colors hover:border-border hover:bg-muted/70 hover:text-heading disabled:opacity-50 sm:px-3 sm:py-2"
                    >
                        <Share2 className="w-5 h-5" />
                        <span className="hidden text-sm font-medium sm:block">Share</span>
                    </button>
                    {hasHistory && (
                        <button
                            onClick={handleHistoryClick}
                            disabled={!isApproved}
                            className="relative z-10 flex items-center gap-2 rounded-full cursor-pointer disabled:cursor-not-allowed border border-transparent p-2 text-muted-foreground transition-colors hover:border-border hover:bg-muted/70 hover:text-heading disabled:opacity-50 sm:px-3 sm:py-2"
                        >
                            <History className="w-5 h-5" />
                            <span className="hidden text-sm font-medium sm:block">History</span>
                        </button>
                    )}
                </div>
            </div>

            <SaveBookmarkModal
                isOpen={isBookmarkModalOpen}
                onClose={() => setIsBookmarkModalOpen(false)}
                postId={post.id}
                isQAPost={isQaPost}
            />

            <SharePostDialog
                post={post as SelectPostDTO}
                open={isShareDialogOpen}
                onOpenChange={setIsShareDialogOpen}
            />

            {hasHistory && (
                <ContentHistoryOverlay
                    contentId={post.id}
                    type={isQaPost ? "qapost" : "post"}
                    open={isHistoryOpen}
                    onClose={() => setIsHistoryOpen(false)}
                />
            )}

            <AlertDialog open={isUnsaveModalOpen} onOpenChange={setIsUnsaveModalOpen}>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Bookmark?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove this post from your saved bookmarks?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isUnsavePending} variant="custom" size="lg" className="btn-secondary">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); confirmUnsave(); }}
                            disabled={isUnsavePending}
                            variant="destructive"
                            size="lg"
                            className="cursor-pointer"
                        >
                            {isUnsavePending ? "Removing..." : "Remove"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </article>
    );
}
