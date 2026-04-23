'use client';

import { useState } from 'react';
import { ArrowBigUp, ArrowBigDown, MoreHorizontal, Flag, UserPlus, Edit, Trash } from 'lucide-react';
import Image from 'next/image';
import { MarkdownViewer } from '../editor/markdown-viewer';
import { MarkdownEditor } from '../editor/markdown-editor';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ReplyAuthor {
    fullName: string;
    avatarUrl?: string;
}

export interface BaseReplyItemProps {
    id: string;
    content: string;
    upvoteCount: number;
    downvoteCount: number;
    dateModified?: string;
    author?: ReplyAuthor;
    authorId: string;
    currentUserId: string;
    onVote: (isUpvote: boolean) => void;
    isVotePending: boolean;
    onDelete: () => void;
    isDeleting: boolean;
    onUpdate: (newContent: string, onSuccess: () => void) => void;
    isUpdating: boolean;
}

export function BaseReplyItem({
    content,
    upvoteCount,
    downvoteCount,
    dateModified,
    author,
    authorId,
    currentUserId,
    onVote,
    isVotePending,
    onDelete,
    isDeleting,
    onUpdate,
    isUpdating,
}: BaseReplyItemProps) {
    const isAuthor = authorId === currentUserId;
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(content);

    const handleSubmit = () => {
        if (!editContent.trim() || editContent === '\n') return; // '\n' is newline char, not literal backslash-n
        onUpdate(editContent, () => setIsEditing(false));
    };

    const handleCancel = () => {
        setEditContent(content);
        setIsEditing(false);
    };

    return (
        <div className="flex gap-3 sm:gap-4 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondary shrink-0 overflow-hidden border border-default relative">
                {author?.avatarUrl ? (
                    <Image src={author.avatarUrl} alt={author.fullName} fill className="object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-heading">
                        {author?.fullName?.charAt(0) || 'U'}
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="bg-card border border-default rounded-2xl rounded-tl-none p-3 sm:p-4 inline-block max-w-full overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-heading text-sm">
                            {author?.fullName || 'Anonymous'}
                        </span>
                        {dateModified && (
                            <span className="text-xs text-muted-foreground">
                                {new Date(dateModified).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>
                    <div className="mt-2 min-w-0">
                        {isEditing ? (
                            <>
                                <MarkdownEditor
                                    value={editContent}
                                    onChange={(val?: string) => setEditContent(val || '')}
                                />
                                <div className="flex items-center justify-end px-2 py-2 sm:px-3 bg-subtle/50 mt-auto border-t border-default/50">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleCancel}
                                            className="btn-ghost px-4 py-1.5 text-sm font-semibold"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={!editContent.trim() || isUpdating}
                                            className="btn-ai disabled:opacity-50 disabled:cursor-not-allowed px-4 py-1.5 text-sm font-semibold"
                                        >
                                            {isUpdating ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <MarkdownViewer source={content} />
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 mt-1.5 ml-2">
                    <button
                        onClick={() => onVote(true)}
                        disabled={isVotePending}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-emerald-500 disabled:opacity-50 font-medium transition-colors"
                    >
                        <ArrowBigUp className="w-4 h-4" />
                        {upvoteCount}
                    </button>
                    <button
                        onClick={() => onVote(false)}
                        disabled={isVotePending}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-rose-500 disabled:opacity-50 font-medium transition-colors"
                    >
                        <ArrowBigDown className="w-4 h-4" />
                        {downvoteCount}
                    </button>
                    <button className="text-xs text-muted-foreground hover:text-heading font-medium transition-colors">
                        Reply
                    </button>
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
                                        <span>Report</span>
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
                                        <span>Edit</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={onDelete}
                                        disabled={isDeleting}
                                        variant='destructive'
                                        className="w-full flex items-center gap-2 p-2.5 text-sm text-destructive cursor-pointer rounded-lg transition-colors font-medium"
                                    >
                                        <Trash className="w-4 h-4" />
                                        <span>Delete</span>
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
