'use client';

import {
    MoreHorizontal,
    ArrowBigUp,
    ArrowBigDown,
    MessageSquare,
    Bookmark,
    Share2,
    UserPlus,
    Flag,
    Edit,
    Trash
} from 'lucide-react';
import { useDeletePostById, useGetPostById } from '@/hooks/post-hooks';
import { useGetProfileById } from '@/hooks/profile-hooks/use-get-profile-by-id';
import { useGetCommentsByPostId } from '@/hooks/comment-hooks/use-get-comments-by-post-id';
import { SortOrderType } from '@/constants/sortOrderType';
import { useUpdateVoteByPostId } from '@/hooks/vote-hooks/use-update-vote-by-post-id';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useGetQAPostById } from '@/hooks/qa-post-hooks/use-get-qa-post-by-id';
import { useGetAnswersByPostId } from '@/hooks/answer-hooks/use-get-answers-by-post-id';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { MarkdownViewer } from '../editor/markdown-viewer';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useDeleteQAPostById } from '@/hooks/qa-post-hooks/use-delete-qa-post-by-id';
import { useState } from 'react';
import { useRouter } from "next/navigation";

interface Props {
    postId: string;
    isQAPost: boolean;
}

export default function PostArticle({ postId, isQAPost }: Props) {
    const router = useRouter();
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);

    const { user } = useSelector((state: RootState) => state.auth);
    // Luôn luôn gọi cả 2, nhưng tùy isQAPost mà bật cái nào, tắt cái nào
    const { data: qaPost, isLoading: isQALoading } = useGetQAPostById(postId, isQAPost);
    const { data: normalPost, isLoading: isNormalLoading } = useGetPostById(postId, !isQAPost);
    // Sau đó quyết định lấy data từ biến nào
    const post = isQAPost ? qaPost : normalPost;
    const isPostLoading = isQAPost ? isQALoading : isNormalLoading;
    const isAuthor = user?.profileId === post?.authorId;

    const { data: author, isLoading: isAuthorLoading } = useGetProfileById(post?.authorId || '');

    const { mutate: deletePost, isPending: isDeletingPost } = useDeletePostById();
    const { mutate: deleteQAPost, isPending: isDeletingQAPost } = useDeleteQAPostById();

    const { mutate: updateVote, isPending: isVotePending } = useUpdateVoteByPostId(postId);

    const handleVote = (e: React.MouseEvent, isUpvote: boolean) => {
        e.preventDefault();
        updateVote({ isUpvote });
    };

    const handleDeletePost = () => {
        const mutationOptions = {
            onSuccess: () => {
                setShowDeleteAlert(false);
                router.push('/feed'); // Redirect user về trang chủ / feed
            },
            onError: () => {
                setShowDeleteAlert(false);
            }
        };

        if (isQAPost) {
            deleteQAPost(postId, mutationOptions);
        } else {
            deletePost(postId, mutationOptions);
        }
    }

    // Minimal fetch just to get total elements if it's not in post DTO
    const { data: answerData } = useGetAnswersByPostId(postId, isQAPost, {
        size: -1,
        pageNumber: 0,
        totalElements: 0,
        orders: [{ sort: 'dateCreated', sortDir: SortOrderType.DESC, dynamicProperty: '', delimiter: '', dataType: '' }],
        filter: [],
        selected: []
    });
    const { data: commentData } = useGetCommentsByPostId(postId, !isQAPost, {
        size: -1,
        pageNumber: 0,
        totalElements: 0,
        orders: [{ sort: 'dateCreated', sortDir: SortOrderType.DESC, dynamicProperty: '', delimiter: '', dataType: '' }],
        filter: [],
        selected: []
    });

    const commentsData = isQAPost ? answerData : commentData;

    const isLoading = isPostLoading || isAuthorLoading;

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
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden border border-default">
                            {author?.avatarUrl ? (
                                <img src={author.avatarUrl} alt={author.fullName} className="w-full h-full object-cover" />
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
                    {/* Dropdown Menu Options */}
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="p-2 text-muted-foreground hover:text-primary hover:bg-subtle rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label="More options"
                            >
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-42 bg-card border rounded-xl shadow-elevated p-1 z-10">
                            {isAuthor ? (
                                <>
                                    <DropdownMenuItem
                                        onClick={() => router.push(`/${isQAPost ? 'questions' : 'post'}/edit/${post.id}`)}
                                        className="w-full flex items-center gap-2 p-2.5 text-sm text-body hover:bg-subtle hover:text-heading cursor-pointer rounded-lg transition-colors font-medium"
                                    >
                                        <Edit className="w-4 h-4" />
                                        <span>Edit Post</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setShowDeleteAlert(true)}
                                        disabled={isDeletingPost || isDeletingQAPost}
                                        variant='destructive'
                                        className="w-full flex items-center gap-2 p-2.5 text-sm text-destructive cursor-pointer rounded-lg transition-colors font-medium"
                                    >
                                        <Trash className="w-4 h-4" />
                                        <span>Delete Post</span>
                                    </DropdownMenuItem>
                                </>
                            ) : (
                                <>
                                    <DropdownMenuItem
                                        className="w-full flex items-center gap-2 p-2.5 text-sm text-body hover:bg-subtle hover:text-heading cursor-pointer rounded-lg transition-colors font-medium"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        <span>Follow User</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        variant='destructive'
                                        className="w-full flex items-center gap-2 p-2.5 text-sm text-destructive cursor-pointer rounded-lg transition-colors font-medium"
                                    >
                                        <Flag className="w-4 h-4" />
                                        <span>Report Comment</span>
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Content */}
                <div className="text-body text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                    <MarkdownViewer source={post.content} />
                </div>
            </div>

            {/* Action Bar */}
            <div className="px-4 sm:px-6 py-3 border-t border-default flex items-center justify-between bg-subtle/30">
                <div className="flex items-center gap-1 sm:gap-2">
                    <div className="flex items-center bg-subtle rounded-full border border-default p-0.5">
                        <button
                            onClick={(e) => handleVote(e, true)}
                            disabled={isVotePending}
                            className="p-1.5 sm:p-2 text-muted-foreground hover:text-emerald-500 disabled:opacity-50 rounded-full hover:bg-page transition-colors flex items-center gap-1.5 group"
                        >
                            <ArrowBigUp className="w-5 h-5 group-hover:fill-emerald-500/20" />
                            <span className="text-sm font-medium pr-1">{post.upvoteCount}</span>
                        </button>
                        <div className="w-px h-5 bg-default mx-0.5"></div>
                        <button
                            onClick={(e) => handleVote(e, false)}
                            disabled={isVotePending}
                            className="p-1.5 sm:p-2 text-muted-foreground hover:text-rose-500 disabled:opacity-50 rounded-full hover:bg-page transition-colors flex items-center gap-1.5 group"
                        >
                            <span className="text-sm font-medium pr-1">{post.downvoteCount}</span>
                            <ArrowBigDown className="w-5 h-5 group-hover:fill-rose-500/20" />
                        </button>
                    </div>

                    <button className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 text-muted-foreground hover:text-heading hover:bg-subtle rounded-full sm:rounded-lg transition-colors">
                        <MessageSquare className="w-5 h-5" />
                        <span className="text-sm font-medium hidden sm:block">{commentsData?.page?.totalElements || 0} {isQAPost ? 'Answers' : 'Comments'}</span>
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
            {/* Delete Confirmation Alert */}
            <AlertDialog
                open={showDeleteAlert}
                onOpenChange={(open) => {
                    if (!isDeletingPost && !isDeletingQAPost) {
                        setShowDeleteAlert(open);
                    }
                }}
            >
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete post?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {`Once you delete this post, it can't be restored.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeletingPost || isDeletingQAPost} variant="custom" size="lg" className="btn-secondary">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault(); // Giữ modal mở để hiển thị trạng thái loading
                                handleDeletePost();
                            }}
                            variant="destructive"
                            disabled={isDeletingPost || isDeletingQAPost}
                            size="lg"
                        >
                            {isDeletingPost || isDeletingQAPost ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </article>
    );
}
