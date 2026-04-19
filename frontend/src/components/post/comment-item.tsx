'use client';

import { useState } from 'react';
import { ArrowBigUp, ArrowBigDown, MoreHorizontal, Flag, UserPlus, Edit, Trash } from 'lucide-react';
import { useUpdateVoteByCommentId } from '@/hooks/vote-hooks/use-update-vote-by-comment-id';
import { SelectCommentDTO } from '@/types/comment/select-comment-dto';
import { MarkdownViewer } from '../editor/markdown-viewer';
import { useDeleteComment } from '@/hooks/comment-hooks/use-delete-comment';
import { MarkdownEditor } from '../editor/markdown-editor';
import { useUpdateComment } from '@/hooks/comment-hooks/use-update-comment';
import { UpdateCommentDTO } from '@/types/comment/update-comment-dto';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function CommentItem({ comment, currentUserId }: { comment: SelectCommentDTO, currentUserId: string }) {
    const { mutate: updateVote, isPending: isVotePending } = useUpdateVoteByCommentId(comment.id);
    const isAuthor = comment.authorId === currentUserId;
    const { mutate: deleteComment, isPending: isDeletingComment } = useDeleteComment();

    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(comment.content);
    const { mutate: updateComment, isPending: isUpdatingComment } = useUpdateComment();

    const handleVote = (isUpvote: boolean) => {
        updateVote({ isUpvote });
    };

    const handleDeleteComment = () => {
        deleteComment(comment.id);
    }

    const handleSubmit = () => {
        if (!content.trim() || content === '\\n') return;
        const payload: UpdateCommentDTO = {
            id: comment.id,
            content: content
        }
        updateComment(payload, {
            onSuccess: () => {
                setIsEditing(false);
            }
        })
    };

    const handleCancel = () => {
        setContent(comment.content);
        setIsEditing(false);
    };

    return (
        <div className="flex gap-3 sm:gap-4 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondary shrink-0 overflow-hidden border border-default">
                {comment.author?.avatarUrl ? (
                    <img src={comment.author.avatarUrl} alt={comment.author.fullName} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-heading">
                        {comment.author?.fullName?.charAt(0) || 'U'}
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="bg-card border border-default rounded-2xl rounded-tl-none p-3 sm:p-4 inline-block max-w-full overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-heading text-sm">
                            {comment.author?.fullName || 'Anonymous'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {new Date(comment.dateModified as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    {/* Render Content bằng Markdown thay vì thẻ <p> thô sơ */}
                    <div className="mt-2 min-w-0">
                        {isEditing ? (
                            <>
                                <MarkdownEditor
                                    value={content}
                                    onChange={(val?: string) => setContent(val || '')}
                                />
                                <div className="flex items-center justify-end px-2 py-2 sm:px-3 bg-subtle/50 mt-auto border-t border-default/50">
                                    {/* Buttons (Bên phải) */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleCancel}
                                            className="btn-ghost px-4 py-1.5 text-sm font-semibold"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={!content.trim() || isUpdatingComment}
                                            className="btn-ai disabled:opacity-50 disabled:cursor-not-allowed px-4 py-1.5 text-sm font-semibold "
                                        >
                                            {isUpdatingComment ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <MarkdownViewer source={comment.content} />
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 mt-1.5 ml-2">
                    <button
                        onClick={() => handleVote(true)}
                        disabled={isVotePending}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-emerald-500 disabled:opacity-50 font-medium transition-colors"
                    >
                        <ArrowBigUp className="w-4 h-4" />
                        {comment.upvoteCount}
                    </button>
                    <button
                        onClick={() => handleVote(false)}
                        disabled={isVotePending}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-rose-500 disabled:opacity-50 font-medium transition-colors"
                    >
                        <ArrowBigDown className="w-4 h-4" />
                        {comment.downvoteCount}
                    </button>
                    <button className="text-xs text-muted-foreground hover:text-heading font-medium transition-colors">
                        Reply
                    </button>
                    {/* Dropdown Menu Options với shadcn/ui */}
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
                            {!isAuthor && (
                                <>
                                    <DropdownMenuItem className="w-full flex items-center gap-2 p-2.5 text-sm text-body hover:bg-subtle hover:text-heading cursor-pointer rounded-lg transition-colors font-medium">
                                        <UserPlus className="w-4 h-4" />
                                        <span>Follow User</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem variant='destructive' className="w-full flex items-center gap-2 p-2.5 text-sm text-destructive cursor-pointer rounded-lg transition-colors font-medium">
                                        <Flag className="w-4 h-4" />
                                        <span>Report Comment</span>
                                    </DropdownMenuItem>
                                </>
                            )}
                            {isAuthor && (
                                <>
                                    <DropdownMenuItem
                                        onClick={() => setIsEditing(true)}
                                        className="w-full flex items-center gap-2 p-2.5 text-sm text-body hover:bg-subtle hover:text-heading cursor-pointer rounded-lg transition-colors font-medium"
                                    >
                                        <Edit className="w-4 h-4" />
                                        <span>Edit Comment</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleDeleteComment}
                                        disabled={isDeletingComment}
                                        variant='destructive'
                                        className="w-full flex items-center gap-2 p-2.5 text-sm text-destructive cursor-pointer rounded-lg transition-colors font-medium"
                                    >
                                        <Trash className="w-4 h-4" />
                                        <span>Delete Comment</span>
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}