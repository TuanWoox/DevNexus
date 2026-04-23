'use client';

import { useGetProfileById } from "@/hooks/profile-hooks/use-get-profile-by-id";
import { SelectPostDTO } from "@/types/post/select-post-dto";
import { Bookmark, Share2, MoreHorizontal, Flag, UserPlus, MessageSquare, ArrowBigUp, ArrowBigDown, Edit, Trash } from "lucide-react";
import Link from "next/link";
import { useUpdateVoteByPostId } from "@/hooks/vote-hooks/use-update-vote-by-post-id";
import { SelectQAPostDTO } from "@/types/qa-post/select-qa-post-dto";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MarkdownViewer } from "../editor/markdown-viewer";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useDeletePostById } from "@/hooks/post-hooks";
import { useDeleteQAPostById } from "@/hooks/qa-post-hooks/use-delete-qa-post-by-id";
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
import { useState } from "react";

interface PostCardProps {
    post: SelectPostDTO | SelectQAPostDTO;
}

export function PostCard({ post }: PostCardProps) {
    const router = useRouter();
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);

    // Get user info from the Auth-Provider to check if the user is the author of post
    const { user } = useSelector((state: RootState) => state.auth);
    const isQaPost = 'answerCount' in post;
    const basePath = isQaPost ? '/questions' : '/post';

    const { data: author } = useGetProfileById(post?.authorId || '');
    const isAuthor = user?.profileId === post.authorId;

    const { mutate: deletePost, isPending: isDeletingPost } = useDeletePostById();
    const { mutate: deleteQAPost, isPending: isDeletingQAPost } = useDeleteQAPostById();
    const { mutate: updateVote, isPending: isVotePending } = useUpdateVoteByPostId(post.id);

    const handleVote = (e: React.MouseEvent, isUpvote: boolean) => {
        e.preventDefault();
        updateVote({ isUpvote });
    };

    const handleDeletePost = () => {
        const mutationOptions = {
            onSettled: () => setShowDeleteAlert(false)
        }

        if (isQaPost) {
            deleteQAPost(post.id, mutationOptions);
        } else {
            deletePost(post.id, mutationOptions);
        }
    }

    // Format ngày tạo bài
    const formattedDate = new Date(post.dateCreated).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });

    return (
        <div
            className="card card-hover p-3 sm:px-5 flex flex-col gap-3 relative animate-in fade-in slide-in-from-bottom-2"
        >
            {/* Header: Author & Options */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden border border-default relative">
                        {author?.avatarUrl ? (
                            <img src={author.avatarUrl} alt={author.fullName} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-primary font-bold">{author?.fullName?.charAt(0) || 'U'}</span>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <Link href={`/profile/${post.authorId}`} className="text-sm font-bold text-heading hover:text-primary transition-colors">
                            {author?.fullName || 'Unknown'}
                        </Link>
                        <span className="text-xs text-muted-foreground">{formattedDate}</span>
                    </div>
                </div>

                {/* Dropdown Menu Options */}
                <DropdownMenu modal={false} >
                    <DropdownMenuTrigger asChild>
                        <button
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-subtle rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring relative z-10"
                            aria-label="More options"
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-42 bg-card border rounded-xl shadow-elevated p-1 relative z-10">
                        {isAuthor ? (
                            <>
                                <DropdownMenuItem
                                    onClick={() => router.push(`${basePath}/edit/${post.id}`)}
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

            {/* Content Wrap in Link */}
            <Link href={`${basePath}/${post.id}`} className="block mt-1 group after:absolute after:inset-0">
                <h2 className="text-lg sm:text-xl font-bold text-heading transition-colors line-clamp-2 leading-tight">
                    {post.title}
                </h2>
            </Link>
            <div
                className="mt-2.5 text-sm sm:text-base text-body line-clamp-3 leading-relaxed relative z-10"
            >
                <MarkdownViewer source={post.content} />
            </div>

            {/* Tags Tags */}
            {post.tagNames && post.tagNames.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1.5">
                    {post.tagNames.map((tag, idx) => (
                        <span key={idx} className="badge-emerald relative z-10">
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Interaction Actions */}
            {/* <div className="flex items-center justify-between mt-2 border-t pt-3"> */}
            <div className="pt-3 border-t flex items-center justify-between bg-subtle/30">
                <div className="flex items-center gap-1 sm:gap-2">
                    {/* Upvote & Downvote Wrapper */}
                    <div className="flex items-center bg-subtle rounded-full border border-default p-0.5 relative z-10">
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

                    {/* Comments/Answers */}
                    {isQaPost ? (
                        <button
                            onClick={() => router.push(`${basePath}/${post.id}`)}
                            className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 text-muted-foreground hover:text-heading hover:bg-subtle rounded-full sm:rounded-lg transition-colors relative z-10"
                        >
                            <MessageSquare className="w-5 h-5" />
                            <span className="text-sm font-medium hidden sm:block">Answers</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => router.push(`${basePath}/${post.id}`)}
                            className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 text-muted-foreground hover:text-heading hover:bg-subtle rounded-full sm:rounded-lg transition-colors relative z-10"
                        >
                            <MessageSquare className="w-5 h-5" />
                            <span className="text-sm font-medium hidden sm:block">Comments</span>
                        </button>
                    )}
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
        </div>
    );
}
