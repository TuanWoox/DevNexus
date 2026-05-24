'use client';

import { useState } from 'react';

import {
    ArrowBigUp,
    ArrowBigDown,
    MessageSquare,
    Bookmark,
    Share2,
    Globe,
    History,
    HelpCircle,
    Code2,
} from 'lucide-react';
import { useGetPostById } from '@/hooks/post-hooks';
import { useUpdateVoteByPostId } from '@/hooks/vote-hooks/use-update-vote-by-post-id';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import Image from 'next/image';
import { useGetQAPostById } from '@/hooks/qa-post-hooks/use-get-qa-post-by-id';
import { MarkdownViewer } from '../editor/markdown-viewer';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useRouter } from "next/navigation";
import { PostActionsDropdown } from './post-actions-dropdown';
import { ProfileHoverCard } from '@/components/profile/profile-hover-card';
import { SelectPostDTO } from '@/types/post/select-post-dto';
import { ModerationBanner } from '@/components/shared/moderation-banner';
import { normalizeModerationStatus } from '@/types/post/moderation-status';
import { SaveBookmarkModal } from '../bookmark/save-bookmark-modal';
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
import { cn } from '@/lib/utils';
import { AiPostSummary } from './ai-post-summary';
import { ContentHistoryOverlay } from '@/components/history/content-history-overlay';
import { SelectQAPostDTO } from '@/types/qa-post/select-qa-post-dto';
import { UserAvatar } from '@/components/shared/user-avatar';
import PostNotFound from './post-not-found';
import PostHeader from './post-header';
import { useMuteGuard } from '@/hooks/community-mute-hooks/use-mute-guard';
import { useGetCommunityById } from '@/hooks/community-hooks/use-get-community-by-id';
import { CommunityApprovalStatus, normalizeCommunityApprovalStatus } from '@/types/enums/community-approval-status';

interface Props {
    postId: string;
    isQAPost: boolean;
    context?: "personal" | "community";
    routeCommunityId?: string;
}

export default function PostArticle({ postId, isQAPost, context = "personal", routeCommunityId }: Props) {
    const router = useRouter();
    const isCommunityContext = context === "community";

    const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
    const [isUnsaveModalOpen, setIsUnsaveModalOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const { mutate: unsaveItem, isPending: isUnsavePending } = useDeleteBookmarkedItemById();

    const { user } = useSelector((state: RootState) => state.auth);
    const { data: qaPost, isLoading: isQALoading, isError: isQAError, error: qaError } = useGetQAPostById(postId, isQAPost);
    const { data: normalPost, isLoading: isNormalLoading, isError: isNormalError, error: normalError } = useGetPostById(postId, !isQAPost);
    const post = isQAPost ? qaPost : normalPost;
    const PostTypeIcon = isQAPost ? HelpCircle : Code2;
    const isPostLoading = isQAPost ? isQALoading : isNormalLoading;
    const communityId = (post as SelectPostDTO | SelectQAPostDTO | undefined)?.communityId;
    const effectiveCommunityId = isCommunityContext ? (routeCommunityId ?? communityId) : undefined;
    const { data: loadedCommunity } = useGetCommunityById(effectiveCommunityId ?? '', Boolean(effectiveCommunityId));

    const { mutate: updateVote, isPending: isVotePending } = useUpdateVoteByPostId(postId);
    const { checkMuted } = useMuteGuard(effectiveCommunityId);

    const isError = isQAPost ? isQAError : isNormalError;
    const error: any = isQAPost ? qaError : normalError;

    if (isError) {
        const isForbidden = error?.response?.status === 403 || error?.response?.status === 401;
        return <PostNotFound isForbidden={isForbidden} />;
    }

    if (!isPostLoading && !post) {
        return <PostNotFound />;
    }
    const isAuthor = user?.profileId === post?.authorId;
    const isAdmin = user?.roles?.includes('Admin') || user?.roles?.includes('Moderator');

    const moderationStatus = normalizeModerationStatus(post?.moderationStatus);
    const isModerationApproved = moderationStatus === "Approved";
    const communityApprovalStatus = normalizeCommunityApprovalStatus(post?.communityApprovalStatus) ?? (post?.communityId ? CommunityApprovalStatus.Pending : null);
    const isCommunityApproved = !post?.communityId ||
        communityApprovalStatus == null ||
        communityApprovalStatus === CommunityApprovalStatus.Approved;
    const isApproved = isModerationApproved && isCommunityApproved;
    const isCommunityPending = post?.communityId && communityApprovalStatus === CommunityApprovalStatus.Pending;
    const isCommunityRejected = post?.communityId && communityApprovalStatus === CommunityApprovalStatus.Rejected;

    const author = post?.author;
    const community = isCommunityContext ? (post as SelectPostDTO)?.community : undefined;
    const currentUserRole = loadedCommunity?.currentUserRole;
    const canModerateCommunity =
        currentUserRole === "Owner" ||
        currentUserRole === "OWNER" ||
        currentUserRole === "Moderator" ||
        currentUserRole === "MODERATOR";

    const handleSaveClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (post?.isSaved && post?.savedBookMarkedItemId) {
            setIsUnsaveModalOpen(true);
        } else {
            setIsBookmarkModalOpen(true);
        }
    };

    const confirmUnsave = () => {
        if (post?.savedBookMarkedItemId) {
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

    const commentCount = isQAPost
        ? (post as SelectQAPostDTO)?.answerCount ?? 0
        : (post as SelectPostDTO)?.commentCount ?? 0;

    const isLoading = isPostLoading;

    if (isLoading) {
        return (
            <article className="bg-card sm:rounded-xl sm:border border-default sm:shadow-sm sm:mx-6 overflow-hidden">
                <div className="p-4 sm:p-6">
                    {/* Skeleton cho Author Info */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-48" />
                            </div>
                        </div>
                        <Skeleton className="w-9 h-9 rounded-full" />
                    </div>

                    {/* Skeleton cho Title (2 dòng) */}
                    <div className="space-y-3 mb-4">
                        <Skeleton className="h-8 sm:h-10 w-3/4" />
                        <Skeleton className="h-8 sm:h-10 w-1/2" />
                    </div>

                    {/* Skeleton cho Content (Nhiều dòng) */}
                    <div className="space-y-3 mb-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-11/12" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                    </div>

                    {/* Skeleton cho Tags */}
                    <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-6 w-16 rounded-md" />
                        <Skeleton className="h-6 w-20 rounded-md" />
                        <Skeleton className="h-6 w-14 rounded-md" />
                    </div>
                </div>

                {/* Skeleton cho Action Bar */}
                <div className="px-4 sm:px-6 py-3 border-t border-default flex items-center justify-between bg-subtle/30">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Skeleton className="h-9 sm:h-10 w-24 rounded-full" />
                        <Skeleton className="h-9 sm:h-10 w-28 rounded-lg" />
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <Skeleton className="h-9 sm:h-10 w-20 rounded-lg" />
                        <Skeleton className="h-9 sm:h-10 w-20 rounded-lg" />
                    </div>
                </div>
            </article>
        );
    }

    if (!post) {
        return <div className="p-6 text-center text-muted-foreground">Post doesn&apos;t exist.</div>;
    }

    const formattedDate = new Date(post.dateModified).toLocaleDateString('en-US', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <>
            <PostHeader />
            <article className={cn(
                "bg-card sm:rounded-xl sm:border border-default sm:shadow-sm sm:mx-6 overflow-hidden",
                !isApproved && "border-dashed"
            )}>
                <div className="p-3 sm:px-5 flex flex-col gap-3">
                    {/* Header: Community/Author & Options */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {community ? (
                                <>
                                    <div className="relative">
                                        <Link href={`/communities/${community.id}`} className="block w-10 h-10 rounded-lg overflow-hidden border border-default bg-primary/10 relative">
                                            {community.communityCoverPhotoUrl ? (
                                                <Image src={community.communityCoverPhotoUrl} alt={community.name} fill unoptimized className="object-cover" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <Globe className="w-5 h-5 text-primary" />
                                                </div>
                                            )}
                                        </Link>
                                        <ProfileHoverCard profileId={post.authorId} author={author} communityId={effectiveCommunityId} showCommunityStatus={Boolean(effectiveCommunityId)} canModerateCommunity={canModerateCommunity}>
                                            <Link href={`/profile/${post.authorId}`} className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-card bg-page overflow-hidden">
                                                <UserAvatar avatarUrl={author?.avatarUrl} fullName={author?.fullName} className="h-full w-full border-0" />
                                            </Link>
                                        </ProfileHoverCard>
                                    </div>
                                    <div className="flex flex-col">
                                        <Link href={`/communities/${community.id}`} className="text-sm font-bold text-heading hover:underline transition-colors truncate max-w-37.5 sm:max-w-75">
                                            {community.name}
                                        </Link>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                            <ProfileHoverCard profileId={post.authorId} author={author} communityId={effectiveCommunityId} showCommunityStatus={Boolean(effectiveCommunityId)} canModerateCommunity={canModerateCommunity}>
                                                <Link href={`/profile/${post.authorId}`} className="font-semibold hover:underline text-muted-foreground transition-colors truncate max-w-30">
                                                    {author?.fullName || 'Unknown'}
                                                </Link>
                                            </ProfileHoverCard>
                                            <span>•</span>
                                            <span suppressHydrationWarning>{formattedDate}</span>
                                            {author?.techStacks && author.techStacks.length > 0 && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-muted-foreground/50 hidden sm:block"></span>
                                                    <span className="truncate max-w-30 sm:max-w-50 hidden sm:block">
                                                        {author.techStacks.join(', ')}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <ProfileHoverCard profileId={post.authorId} author={author}>
                                        <Link href={`/profile/${post.authorId}`} className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden border border-default relative">
                                            <UserAvatar avatarUrl={author?.avatarUrl} fullName={author?.fullName} className="h-full w-full border-0" />
                                        </Link>
                                    </ProfileHoverCard>
                                    <div className="flex flex-col">
                                        <ProfileHoverCard profileId={post.authorId} author={author}>
                                            <Link href={`/profile/${post.authorId}`} className="text-sm font-semibold text-heading hover:text-primary transition-colors">
                                                {author?.fullName || 'Unknown'}
                                            </Link>
                                        </ProfileHoverCard>
                                        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-2 mt-0.5">
                                            {formattedDate}
                                            {author?.techStacks && author.techStacks.length > 0 && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-muted-foreground/50 hidden sm:block"></span>
                                                    <span className="truncate max-w-30 sm:max-w-50 hidden sm:block">
                                                        {author.techStacks.join(', ')}
                                                    </span>
                                                </>
                                            )}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                        {/* Post Actions Dropdown (Edit / Delete / Follow / Report) */}
                        {/* <PostActionsDropdown
                        postId={postId}
                        isQAPost={isQAPost}
                        isAuthor={isAuthor}
                        onDeleted={() => router.push('/feed')}
                    /> */}
                        <div className="relative z-10 flex items-center gap-2">
                            <div className="hidden items-center gap-1.5 rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary sm:flex">
                                <PostTypeIcon className="h-3.5 w-3.5" />
                                <span className="text-sm">{isQAPost ? 'Q&A' : 'Discussion'}</span>
                            </div>
                            <PostActionsDropdown
                                postId={postId}
                                communityId={isCommunityContext ? post.communityId : undefined}
                                isQAPost={isQAPost}
                                isAuthor={isAuthor}
                                canModerateCommunity={isCommunityContext ? canModerateCommunity : false}
                                onDeleted={() => router.push('/feed')}
                            />
                        </div>
                    </div>

                    {/* Moderation Banner — only visible to author or admin */}
                    {(isAuthor || isAdmin) && post.moderationStatus !== undefined && (
                        <ModerationBanner
                            status={normalizeModerationStatus(post.moderationStatus)}
                            reason={post.moderationReason}
                            className="mb-1"
                        />
                    )}

                    {(isCommunityPending || isCommunityRejected) && (
                        <div className={cn(
                            "rounded-lg border px-3 py-2 text-sm font-medium",
                            isCommunityRejected
                                ? "border-destructive/30 bg-destructive/10 text-destructive"
                                : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        )}>
                            {isCommunityRejected ? "Rejected by community moderators" : "Pending community approval"}
                            {post.communityApprovalReason ? `: ${post.communityApprovalReason}` : ""}
                        </div>
                    )}

                    {/* Title */}
                    <h1 className="text-2xl sm:text-3xl font-bold text-heading leading-tight">
                        {post.title}
                    </h1>

                    {/* AI TL;DR Summary — lazy, only on post detail, never in feed */}
                    {!isQAPost && isApproved && (
                        <AiPostSummary
                            postId={postId}
                            contentLength={post.content?.length ?? 0}
                        />
                    )}

                    {/* Content */}
                    <div className={cn(
                        "text-body text-sm sm:text-base leading-relaxed whitespace-pre-wrap transition-all",
                        !isApproved && "opacity-70 grayscale-20"
                    )}>
                        <MarkdownViewer
                            source={post.content}
                            enableCodeTools
                            context="post-detail"
                            postId={post.id}
                        />
                    </div>

                    {/* Tags */}
                    {post.tagNames.length !== 0 && (
                        <div className="flex flex-wrap gap-2">
                            {post.tagNames?.map((tag) => (
                                <span key={tag} className="badge-emerald px-2.5 py-1 text-xs rounded-md">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Action Bar */}
                <div className="px-4 sm:px-6 py-3 border-t border-default flex items-center justify-between bg-subtle/30">
                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className="flex items-center bg-subtle rounded-full border border-default p-0.5">
                            <button
                                onClick={(e) => handleVote(e, true)}
                                disabled={isVotePending || !isApproved}
                                className={`p-1.5 sm:p-2 disabled:opacity-50 rounded-full hover:bg-page transition-colors flex items-center gap-1.5 group cursor-pointer disabled:cursor-not-allowed
                                ${post.currentUserVote === true
                                        ? 'text-emerald-500'
                                        : 'text-muted-foreground hover:text-emerald-500'
                                    }`}
                            >
                                <ArrowBigUp className={`w-5 h-5 transition-all ${post.currentUserVote === true ? 'fill-emerald-500' : 'group-hover:fill-emerald-500/20'}`} />
                                <span className="text-sm font-medium pr-1">{post.upvoteCount}</span>
                            </button>
                            <div className="w-px h-5 bg-default mx-0.5"></div>
                            <button
                                onClick={(e) => handleVote(e, false)}
                                disabled={isVotePending || !isApproved}
                                className={`p-1.5 sm:p-2 disabled:opacity-50 rounded-full hover:bg-page transition-colors flex items-center gap-1.5 group cursor-pointer disabled:cursor-not-allowed
                                ${post.currentUserVote === false
                                        ? 'text-rose-500'
                                        : 'text-muted-foreground hover:text-rose-500'
                                    }`}
                            >
                                <span className="text-sm font-medium pr-1">{post.downvoteCount}</span>
                                <ArrowBigDown className={`w-5 h-5 transition-all ${post.currentUserVote === false ? 'fill-rose-500' : 'group-hover:fill-rose-500/20'}`} />
                            </button>
                        </div>

                        {isApproved ? (
                            <button className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 text-muted-foreground hover:text-heading hover:bg-subtle rounded-full sm:rounded-lg transition-colors">
                                <MessageSquare className="w-5 h-5" />
                                <span className="text-sm font-medium hidden sm:block">{commentCount} {isQAPost ? 'Answers' : 'Comments'}</span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 cursor-not-allowed text-muted-foreground opacity-50 rounded-full sm:rounded-lg relative z-10" aria-disabled>
                                <MessageSquare className="w-5 h-5" />
                                <span className="text-sm font-medium hidden sm:block">{commentCount} {isQAPost ? 'Answers' : 'Comments'}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        <button
                            onClick={handleSaveClick}
                            disabled={!isApproved}
                            className={`p-2 sm:px-3 sm:py-2 hover:bg-subtle rounded-full sm:rounded-lg cursor-pointer disabled:cursor-not-allowed transition-colors flex items-center gap-2 relative z-10 disabled:opacity-50 ${post.isSaved ? 'text-heading hover:text-heading/80' : 'text-muted-foreground hover:text-heading'}`}
                        >
                            <Bookmark className={`w-5 h-5 ${post.isSaved ? 'fill-foreground text-heading' : ''}`} />
                            <span className="text-sm font-medium hidden sm:block">{post?.isSaved ? 'Saved' : 'Save'}</span>
                        </button>
                        <button
                            disabled={!isApproved}
                            className="p-2 sm:px-3 sm:py-2 text-muted-foreground hover:text-heading hover:bg-subtle rounded-full sm:rounded-lg cursor-pointer disabled:cursor-not-allowed transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <Share2 className="w-5 h-5" />
                            <span className="text-sm font-medium hidden sm:block">Share</span>
                        </button>
                        <button
                            onClick={() => setIsHistoryOpen(true)}
                            disabled={!isApproved}
                            className="p-2 sm:px-3 sm:py-2 text-muted-foreground hover:text-heading hover:bg-subtle rounded-full sm:rounded-lg cursor-pointer disabled:cursor-not-allowed transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <History className="w-5 h-5" />
                            <span className="text-sm font-medium hidden sm:block">History</span>
                        </button>
                    </div>
                </div>

                <SaveBookmarkModal
                    isOpen={isBookmarkModalOpen}
                    onClose={() => setIsBookmarkModalOpen(false)}
                    postId={postId}
                    isQAPost={isQAPost}
                />

                <ContentHistoryOverlay
                    contentId={postId}
                    type={isQAPost ? "qapost" : "post"}
                    open={isHistoryOpen}
                    onClose={() => setIsHistoryOpen(false)}
                />

                <AlertDialog open={isUnsaveModalOpen} onOpenChange={setIsUnsaveModalOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Remove Bookmark?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to remove this post from your saved bookmarks?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isUnsavePending} variant="custom" size="lg" className="btn-secondary">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmUnsave}
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
        </>
    );
}
