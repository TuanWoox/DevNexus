'use client';

import { Bookmark, Share2, MessageSquare, ArrowBigUp, ArrowBigDown, Globe } from "lucide-react";
import { SelectPostDTO } from "@/types/post/select-post-dto";
import Link from "next/link";
import Image from "next/image";
import { useUpdateVoteByPostId } from "@/hooks/vote-hooks/use-update-vote-by-post-id";
import { SelectQAPostDTO } from "@/types/qa-post/select-qa-post-dto";
import { MarkdownViewer } from "../editor/markdown-viewer";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { PostActionsDropdown } from "./post-actions-dropdown";

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
        <div className="card card-hover p-3 sm:px-5 flex flex-col gap-3 relative animate-in fade-in slide-in-from-bottom-2">
            {/* Header: Community/Author & Options */}
            <div className="flex items-start justify-between">
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
                                <Link href={`/profile/${post.authorId}`} className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-card bg-page overflow-hidden">
                                    {author?.avatarUrl ? (
                                        <Image src={author.avatarUrl} alt={author.fullName} fill unoptimized className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                                            <span className="text-[10px] font-bold text-primary">{author?.fullName?.charAt(0) || 'U'}</span>
                                        </div>
                                    )}
                                </Link>
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                    <Link href={`/communities/${community.id}`} className="text-sm font-bold text-heading hover:underline transition-colors truncate max-w-[150px] sm:max-w-[200px]">
                                        {community.name}
                                    </Link>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                    <Link href={`/profile/${post.authorId}`} className="font-semibold hover:underline text-muted-foreground transition-colors truncate max-w-[100px]">
                                        {author?.fullName || 'Unknown'}
                                    </Link>
                                    <span>•</span>
                                    <span suppressHydrationWarning>{formattedDate}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Standard Profile Post Header Style */
                        <>
                            <Link href={`/profile/${post.authorId}`} className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden border border-default relative">
                                {author?.avatarUrl ? (
                                    <Image src={author.avatarUrl} alt={author.fullName} fill unoptimized className="object-cover" />
                                ) : (
                                    <span className="text-primary font-bold">{author?.fullName?.charAt(0) || 'U'}</span>
                                )}
                            </Link>
                            <div className="flex flex-col">
                                <Link href={`/profile/${post.authorId}`} className="text-sm font-semibold text-heading hover:text-primary transition-colors">
                                    {author?.fullName || 'Unknown'}
                                </Link>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-xs font-semibold text-muted-foreground" suppressHydrationWarning>{formattedDate}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <PostActionsDropdown
                    postId={post.id}
                    isQAPost={isQaPost}
                    isAuthor={isAuthor}
                    dropdownClassName="relative z-10"
                />
            </div>

            {/* Content Wrap in Link */}
            <Link href={`${basePath}/${post.id}`} className="block group after:absolute after:inset-0">
                <h2 className="text-lg sm:text-xl font-bold text-heading transition-colors line-clamp-2 leading-tight">
                    {post.title}
                </h2>
            </Link>
            <div className="text-sm sm:text-base text-body line-clamp-3 leading-relaxed relative z-10">
                <MarkdownViewer source={post.content} />
            </div>

            {/* Tags */}
            {post.tagNames && post.tagNames.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {post.tagNames.map((tag) => (
                        <span key={tag} className="badge-emerald relative z-10">
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Interaction Actions */}
            <div className="pt-3 border-t flex items-center justify-between bg-subtle/30">
                <div className="flex items-center gap-1 sm:gap-2">
                    <div className="flex items-center bg-subtle rounded-full border border-default p-0.5 relative z-10">
                        <button
                            onClick={(e) => handleVote(e, true)}
                            disabled={isVotePending}
                            className={`p-1.5 sm:p-2 disabled:opacity-50 rounded-full hover:bg-page transition-colors flex items-center gap-1.5 group
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
                            disabled={isVotePending}
                            className={`p-1.5 sm:p-2 disabled:opacity-50 rounded-full hover:bg-page transition-colors flex items-center gap-1.5 group
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
                        className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 text-muted-foreground hover:text-heading hover:bg-subtle rounded-full sm:rounded-lg transition-colors relative z-10"
                    >
                        <MessageSquare className="w-5 h-5" />
                        <span className="text-sm font-medium">{isQaPost ? (post as SelectQAPostDTO).answerCount : post.commentCount}</span>
                        <span className="text-sm font-medium hidden sm:block">{isQaPost ? 'Answers' : 'Comments'}</span>
                    </Link>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                    <button className="p-2 sm:px-3 sm:py-2 text-muted-foreground hover:text-heading hover:bg-subtle rounded-full sm:rounded-lg transition-colors flex items-center gap-2 relative z-10">
                        <Bookmark className="w-5 h-5" />
                        <span className="text-sm font-medium hidden sm:block">Save</span>
                    </button>
                    <button className="p-2 sm:px-3 sm:py-2 text-muted-foreground hover:text-heading hover:bg-subtle rounded-full sm:rounded-lg transition-colors flex items-center gap-2 relative z-10">
                        <Share2 className="w-5 h-5" />
                        <span className="text-sm font-medium hidden sm:block">Share</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
