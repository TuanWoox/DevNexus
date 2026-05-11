'use client';

import { Bookmark, Share2, MessageSquare, ArrowBigUp, ArrowBigDown, Globe, Code2, HelpCircle } from "lucide-react";
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

import { useHasMounted } from "@/hooks/use-has-mounted";

interface PostCardProps {
    post: SelectPostDTO | SelectQAPostDTO;
}

export function PostCard({ post }: PostCardProps) {
    const hasMounted = useHasMounted();
    const { user } = useSelector((state: RootState) => state.auth);
    const isQaPost = 'answerCount' in post;
    const basePath = isQaPost ? '/questions' : '/post';

    const author = post.author;
    const community = (post as SelectPostDTO).community;
    const PostTypeIcon = isQaPost ? HelpCircle : Code2;
    // Auth state is client-side only (Redux), so we gate it with hasMounted to ensure 
    // the server and client initial render match perfectly.
    const isAuthor = hasMounted && user?.profileId === post.authorId;

    const { mutate: updateVote, isPending: isVotePending } = useUpdateVoteByPostId(post.id);

    const handleVote = (e: React.MouseEvent, isUpvote: boolean) => {
        e.preventDefault();
        updateVote({ isUpvote });
    };

    // Note: Dates can cause hydration mismatches if server and client have different locales.
    // We use suppressHydrationWarning on the element where this is rendered.
    const formattedDate = new Date(post.dateModified).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });

    return (
        <article className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border/70 bg-card/95 p-4 text-card-foreground shadow-card backdrop-blur-sm transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-elevated sm:p-5">
            {/* Header: Community/Author & Options */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 relative z-10">
                    {community ? (
                        /* Community Post Header Style */
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
                                <ProfileHoverCard profileId={post.authorId} author={author}>
                                    <Link href={`/profile/${post.authorId}`} className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-card bg-page overflow-hidden">
                                        {author?.avatarUrl ? (
                                            <Image src={author.avatarUrl} alt={author.fullName} fill unoptimized className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                                                <span className="text-[10px] font-bold text-primary">{author?.fullName?.charAt(0) || 'U'}</span>
                                            </div>
                                        )}
                                    </Link>
                                </ProfileHoverCard>
                            </div>
                            <div className="flex min-w-0 flex-col">
                                <div className="flex items-center gap-1.5">
                                    <Link href={`/communities/${community.id}`} className="text-sm font-bold text-heading hover:underline transition-colors truncate max-w-[150px] sm:max-w-[200px]">
                                        {community.name}
                                    </Link>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                    <ProfileHoverCard profileId={post.authorId} author={author}>
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
                                    {author?.avatarUrl ? (
                                        <Image src={author.avatarUrl} alt={author.fullName} fill unoptimized className="object-cover" />
                                    ) : (
                                        <span className="text-primary font-bold">{author?.fullName?.charAt(0) || 'U'}</span>
                                    )}
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
                    <div className="hidden items-center gap-1.5 rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary sm:flex">
                        <PostTypeIcon className="h-3.5 w-3.5" />
                        <span>{isQaPost ? 'Q&A' : 'Discussion'}</span>
                    </div>
                    <PostActionsDropdown
                        postId={post.id}
                        isQAPost={isQaPost}
                        isAuthor={isAuthor}
                        dropdownClassName="relative z-10"
                    />
                </div>
            </div>

            {/* Content Wrap in Link */}
            <div className="relative z-10 rounded-2xl border border-border/60 bg-background/45 p-3 sm:p-4">
                <Link href={`${basePath}/${post.id}`} className="block after:absolute after:inset-0">
                    <h2 className="line-clamp-2 text-lg font-bold leading-tight text-heading transition-colors group-hover:text-primary sm:text-xl">
                        {post.title}
                    </h2>
                </Link>
                <div className="mt-2 line-clamp-3 text-sm leading-relaxed text-body sm:text-base">
                    <MarkdownViewer source={post.content} />
                </div>
            </div>

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
                            disabled={isVotePending}
                            className={`flex items-center gap-1.5 rounded-full p-1.5 transition-colors hover:bg-background disabled:opacity-50 sm:p-2
                                ${post.currentUserVote === true
                                    ? 'text-emerald-500'
                                    : 'text-muted-foreground hover:text-emerald-500'
                                }`}
                        >
                            <ArrowBigUp className={`w-5 h-5 transition-all ${post.currentUserVote === true ? 'fill-emerald-500' : 'group-hover:fill-emerald-500/20'}`} />
                            <span className="text-sm font-medium pr-1">{post.upvoteCount}</span>
                        </button>
                        <div className="mx-0.5 h-5 w-px bg-border"></div>
                        <button
                            onClick={(e) => handleVote(e, false)}
                            disabled={isVotePending}
                            className={`flex items-center gap-1.5 rounded-full p-1.5 transition-colors hover:bg-background disabled:opacity-50 sm:p-2
                                ${post.currentUserVote === false
                                    ? 'text-rose-500'
                                    : 'text-muted-foreground hover:text-rose-500'
                                }`}
                        >
                            <span className="text-sm font-medium pr-1">{post.downvoteCount}</span>
                            <ArrowBigDown className={`w-5 h-5 transition-all ${post.currentUserVote === false ? 'fill-rose-500' : 'group-hover:fill-rose-500/20'}`} />
                        </button>
                    </div>

                    {/* Comments/Answers — Link instead of button for right-click support */}
                    <Link
                        href={`${basePath}/${post.id}`}
                        className="relative z-10 flex items-center gap-2 rounded-full border border-transparent p-2 text-muted-foreground transition-colors hover:border-border hover:bg-muted/70 hover:text-heading sm:px-3 sm:py-2"
                    >
                        <MessageSquare className="w-5 h-5" />
                        <span className="text-sm font-medium">{isQaPost ? (post as SelectQAPostDTO).answerCount : post.commentCount}</span>
                        <span className="text-sm font-medium hidden sm:block">{isQaPost ? 'Answers' : 'Comments'}</span>
                    </Link>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                    <button className="relative z-10 flex items-center gap-2 rounded-full border border-transparent p-2 text-muted-foreground transition-colors hover:border-border hover:bg-muted/70 hover:text-heading sm:px-3 sm:py-2">
                        <Bookmark className="w-5 h-5" />
                        <span className="hidden text-sm font-medium sm:block">Save</span>
                    </button>
                    <button className="relative z-10 flex items-center gap-2 rounded-full border border-transparent p-2 text-muted-foreground transition-colors hover:border-border hover:bg-muted/70 hover:text-heading sm:px-3 sm:py-2">
                        <Share2 className="w-5 h-5" />
                        <span className="hidden text-sm font-medium sm:block">Share</span>
                    </button>
                </div>
            </div>
        </article>
    );
}
