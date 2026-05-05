'use client';

import {
    ArrowBigUp,
    ArrowBigDown,
    MessageSquare,
    Bookmark,
    Share2,
} from 'lucide-react';
import { useGetPostById } from '@/hooks/post-hooks';
import { useGetCommentsByPostId } from '@/hooks/comment-hooks/use-get-comments-by-post-id';
import { SortOrderType } from '@/constants/sortOrderType';
import { useUpdateVoteByPostId } from '@/hooks/vote-hooks/use-update-vote-by-post-id';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import Image from 'next/image';
import { useGetQAPostById } from '@/hooks/qa-post-hooks/use-get-qa-post-by-id';
import { MarkdownViewer } from '../editor/markdown-viewer';
import { WysiwygRenderer } from '../editor/wysiwyg-renderer';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useRouter } from "next/navigation";
import { PostActionsDropdown } from './post-actions-dropdown';

interface Props {
    postId: string;
    isQAPost: boolean;
}

export default function PostArticle({ postId, isQAPost }: Props) {
    const router = useRouter();

    const { user } = useSelector((state: RootState) => state.auth);
    const { data: qaPost, isLoading: isQALoading } = useGetQAPostById(postId, isQAPost);
    const { data: normalPost, isLoading: isNormalLoading } = useGetPostById(postId, !isQAPost);
    const post = isQAPost ? qaPost : normalPost;
    const isPostLoading = isQAPost ? isQALoading : isNormalLoading;
    const isAuthor = user?.profileId === post?.authorId;

    const author = post?.author;

    const { mutate: updateVote, isPending: isVotePending } = useUpdateVoteByPostId(postId);

    const handleVote = (e: React.MouseEvent, isUpvote: boolean) => {
        e.preventDefault();
        updateVote({ isUpvote });
    };

    // QA posts already include answerCount in the DTO — no extra fetch needed.
    // Use the same payload as CommentSection so React Query deduplicates into one request.
    const { data: commentCountData } = useGetCommentsByPostId(postId, !isQAPost, {
        size: 20,
        pageNumber: 0,
        totalElements: 0,
        orders: [{ sort: 'dateCreated', sortDir: SortOrderType.DESC, dynamicProperty: '', delimiter: '', dataType: '' }],
        filter: [],
        selected: []
    });

    const commentCount = isQAPost
        ? (post as import('@/types/qa-post/select-qa-post-dto').SelectQAPostDTO)?.answerCount ?? 0
        : commentCountData?.page?.totalElements ?? 0;

    const isLoading = isPostLoading;

    if (isLoading) {
        return (
            <article className="bg-card sm:rounded-xl sm:border border-default sm:shadow-sm sm:mx-6 overflow-hidden">
                <div className="p-4 sm:p-6">
                    {/* Skeleton cho Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        <Skeleton className="h-6 w-16 rounded-md" />
                        <Skeleton className="h-6 w-20 rounded-md" />
                        <Skeleton className="h-6 w-14 rounded-md" />
                    </div>

                    {/* Skeleton cho Title (2 dòng) */}
                    <div className="space-y-3 mb-6">
                        <Skeleton className="h-8 sm:h-10 w-3/4" />
                        <Skeleton className="h-8 sm:h-10 w-1/2" />
                    </div>

                    {/* Skeleton cho Author Info */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-48" />
                            </div>
                        </div>
                        <Skeleton className="w-9 h-9 rounded-full" />
                    </div>

                    {/* Skeleton cho Content (Nhiều dòng) */}
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-11/12" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
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

    const formattedDate = new Date(post.dateCreated).toLocaleDateString('en-US', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <article className="bg-card sm:rounded-xl sm:border border-default sm:shadow-sm sm:mx-6 overflow-hidden">
            <div className="p-4 sm:p-6">
                {/* Tags */}
                {post.tagNames.length !== 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {post.tagNames?.map((tag) => (
                            <span key={tag} className="badge-emerald px-2.5 py-1 text-xs rounded-md">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}


                {/* Title */}
                <h1 className="text-2xl sm:text-3xl font-bold text-heading leading-tight mb-3">
                    {post.title}
                </h1>

                {/* Author Info */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden border border-default relative">
                            {author?.avatarUrl ? (
                                <Image src={author.avatarUrl} alt={author.fullName} fill className="object-cover" />
                            ) : (
                                <span className="text-primary font-bold">{author?.fullName?.charAt(0) || 'U'}</span>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <Link href={`/profile/${post.authorId}`} className="text-sm sm:text-base font-semibold text-heading hover:text-primary transition-colors">
                                {author?.fullName || 'Unknown'}
                            </Link>
                            <span className="text-xs text-muted-foreground flex items-center gap-2">
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
                    </div>
                    {/* Post Actions Dropdown (Edit / Delete / Follow / Report) */}
                    <PostActionsDropdown
                        postId={postId}
                        isQAPost={isQAPost}
                        isAuthor={isAuthor}
                        onDeleted={() => router.push('/feed')}
                    />
                </div>

                {/* Content */}
                <div className="text-body text-sm sm:text-base leading-relaxed">
                    {post.postType === 1 ? (
                        <WysiwygRenderer html={post.content} />
                    ) : (
                        <MarkdownViewer source={post.content} />
                    )}
                </div>
            </div>

            {/* Action Bar */}
            <div className="px-4 sm:px-6 py-3 border-t border-default flex items-center justify-between bg-subtle/30">
                <div className="flex items-center gap-1 sm:gap-2">
                    <div className="flex items-center bg-subtle rounded-full border border-default p-0.5">
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

                    <button className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 text-muted-foreground hover:text-heading hover:bg-subtle rounded-full sm:rounded-lg transition-colors">
                        <MessageSquare className="w-5 h-5" />
                        <span className="text-sm font-medium hidden sm:block">{commentCount} {isQAPost ? 'Answers' : 'Comments'}</span>
                    </button>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                    <button className="p-2 sm:px-3 sm:py-2 text-muted-foreground hover:text-primary hover:bg-subtle rounded-full sm:rounded-lg transition-colors flex items-center gap-2">
                        <Bookmark className="w-5 h-5" />
                        <span className="text-sm font-medium hidden sm:block">Save</span>
                    </button>
                    <button className="p-2 sm:px-3 sm:py-2 text-muted-foreground hover:text-heading hover:bg-subtle rounded-full sm:rounded-lg transition-colors flex items-center gap-2">
                        <Share2 className="w-5 h-5" />
                        <span className="text-sm font-medium hidden sm:block">Share</span>
                    </button>
                </div>
            </div>
        </article>
    );
}
