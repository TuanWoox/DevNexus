'use client';

import { useState } from 'react';
import { ArrowBigUp, ArrowBigDown, MoreHorizontal, Flag, UserPlus, Edit, Trash, CheckCircle, Check } from 'lucide-react';
import Image from 'next/image';
import { MarkdownViewer } from '../editor/markdown-viewer';
import { MarkdownEditor } from '../editor/markdown-editor';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from 'next/link';
import { ProfileHoverCard } from '@/components/profile/profile-hover-card';

export interface ReplyAuthor {
    fullName: string;
    avatarUrl?: string;
    backgroundUrl?: string;
    bio?: string;
    reputationPoints?: number;
    techStacks?: string[];
    isPrivate?: boolean;
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
    currentUserVote?: boolean | null; // null/undefined = no vote, true = upvoted, false = downvoted
    onVote: (isUpvote: boolean) => void;
    isVotePending: boolean;
    onDelete: () => void;
    isDeleting: boolean;
    onUpdate: (newContent: string, onSuccess: () => void) => void;
    isUpdating: boolean;
    isDisabled?: boolean;
    isAccepted?: boolean;
    onAccept?: () => void;
    canAccept?: boolean;
    isAccepting?: boolean;
    isReplying?: boolean;
    onToggleReply?: () => void;
    replyInput?: React.ReactNode;
    hideReplyButton?: boolean;
}

export function BaseReplyItem({
    content,
    upvoteCount,
    downvoteCount,
    dateModified,
    author,
    authorId,
    currentUserId,
    currentUserVote,
    onVote,
    isVotePending,
    onDelete,
    isDeleting,
    onUpdate,
    isUpdating,
    isDisabled,
    isAccepted,
    onAccept,
    canAccept,
    isAccepting,
    isReplying,
    onToggleReply,
    replyInput,
    hideReplyButton,
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
            <ProfileHoverCard profileId={authorId} author={author}>
                <Link href={`/profile/${authorId}`} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondary shrink-0 overflow-hidden border border-default relative">
                    {author?.avatarUrl ? (
                        <Image src={author.avatarUrl} alt={author.fullName} fill unoptimized className="object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-heading">
                            {author?.fullName?.charAt(0) || 'U'}
                        </div>
                    )}
                </Link>
            </ProfileHoverCard>

            <div className="flex-1 min-w-0">
                <div className={`bg-card border rounded-2xl rounded-tl-none p-3 sm:p-4 inline-block max-w-full overflow-hidden ${isAccepted ? 'border-emerald-500 bg-emerald-500/5 shadow-sm' : 'border-default'}`}>
                    <div className="flex items-center gap-2 mb-1">
                        <ProfileHoverCard profileId={authorId} author={author}>
                            <Link href={`/profile/${authorId}`} className="text-sm font-semibold text-heading hover:text-primary transition-colors">
                                {author?.fullName || 'Unknown'}
                            </Link>
                        </ProfileHoverCard>
                        {dateModified && (
                            <span className="text-xs font-semibold text-muted-foreground">
                                {new Date(dateModified).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                        {isAccepted && (
                            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-emerald-500 ring-1 ring-emerald-500/20 ring-inset">
                                <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                Accepted Answer
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
                        disabled={isVotePending || isDisabled}
                        className={`flex items-center gap-1 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer
                            ${currentUserVote === true
                                ? 'text-emerald-500'
                                : 'text-muted-foreground hover:text-emerald-500'
                            }`}
                    >
                        <ArrowBigUp className={`w-4 h-4 transition-all ${currentUserVote === true ? 'fill-emerald-500' : ''}`} />
                        {upvoteCount}
                    </button>
                    <button
                        onClick={() => onVote(false)}
                        disabled={isVotePending || isDisabled}
                        className={`flex items-center gap-1 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer
                            ${currentUserVote === false
                                ? 'text-rose-500'
                                : 'text-muted-foreground hover:text-rose-500'
                            }`}
                    >
                        <ArrowBigDown className={`w-4 h-4 transition-all ${currentUserVote === false ? 'fill-rose-500' : ''}`} />
                        {downvoteCount}
                    </button>
                    {!hideReplyButton && (
                        <button
                            onClick={onToggleReply}
                            disabled={isDisabled}
                            className={`text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer ${isReplying ? 'text-primary' : 'text-muted-foreground hover:text-heading'}`}
                        >
                            Reply
                        </button>
                    )}
                    {canAccept && (
                        <button
                            onClick={onAccept}
                            disabled={isAccepting || isDisabled}
                            className="flex items-center gap-1 text-xs font-semibold text-emerald-500 hover:text-emerald-600 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            <Check className="w-4 h-4" />
                            {isAccepting ? 'Accepting...' : 'Accept'}
                        </button>
                    )}
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="p-2 text-muted-foreground hover:text-primary hover:bg-subtle rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                                aria-label="More options"
                            >
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-42 bg-card border rounded-xl shadow-elevated p-1 z-10">
                            {!isAuthor && !isDisabled && (
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
                            {isAuthor && !isDisabled && (
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
                            {isDisabled && (
                                <DropdownMenuItem disabled className="text-xs text-muted-foreground p-2 text-center">
                                    Actions disabled for unapproved post
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                {isReplying && replyInput && (
                    <div className="mt-4">
                        {replyInput}
                    </div>
                )}
            </div>
        </div>
    );
}
