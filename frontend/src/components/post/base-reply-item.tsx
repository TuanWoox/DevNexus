'use client';

import { useRef, useState } from 'react';
import { ArrowBigUp, ArrowBigDown, MoreHorizontal, Flag, Edit, Trash, CheckCircle, Check, History, Sparkles } from 'lucide-react';
import { UserAvatar } from '@/components/shared/user-avatar';
import { MarkdownViewer } from '../editor/markdown-viewer';
import { MarkdownEditor, MarkdownEditorHandle } from '../editor/markdown-editor';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from 'next/link';
import { ProfileHoverCard } from '@/components/profile/profile-hover-card';
import { ContentType } from '@/types/content-media/content-type';
import { useUploadContentMedia } from '@/hooks/media/useUploadContentMedia';
import { ContentHistoryOverlay, ContentHistoryKind } from '@/components/history/content-history-overlay';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCommunityContentReport } from '@/hooks/community-content-report-hooks/use-create-community-content-report';
import { ReportDialog } from '@/components/report/report-dialog';
import { ReportTargetType } from '@/types/report/report-target-type';
import { useMuteGuard } from '@/hooks/community-mute-hooks/use-mute-guard';
import { ModerationStatus, normalizeModerationStatus } from '@/types/post/moderation-status';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { ModerationBanner } from '@/components/shared/moderation-banner';
import { cn } from '@/lib/utils';

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
    contentType: ContentType;
    onUpdate: (newContent: string, mediaIds: string[], onSuccess: () => void) => void;
    isUpdating: boolean;
    isDisabled?: boolean;
    moderationStatus?: ModerationStatus;
    communityId?: string | null;
    canModerateCommunity?: boolean;
    isAccepted?: boolean;
    isSystemAnswer?: boolean;
    onAccept?: () => void;
    canAccept?: boolean;
    isAccepting?: boolean;
    isReplying?: boolean;
    onToggleReply?: () => void;
    replyInput?: React.ReactNode;
    hideReplyButton?: boolean;
    context?: "personal" | "community";
}

export function BaseReplyItem({
    id,
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
    contentType,
    onUpdate,
    isUpdating,
    isDisabled,
    moderationStatus,
    communityId,
    canModerateCommunity = false,
    isAccepted,
    isSystemAnswer = false,
    onAccept,
    canAccept,
    isAccepting,
    isReplying,
    onToggleReply,
    replyInput,
    hideReplyButton,
    context = "personal",
}: BaseReplyItemProps) {
    const isAuthor = authorId === currentUserId;
    const isCommunityContext = context === "community" && Boolean(communityId);
    const effectiveCommunityId = isCommunityContext ? communityId : undefined;
    const canDelete = isAuthor || (isCommunityContext && canModerateCommunity);
    const [isEditing, setIsEditing] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isCommunityReportOpen, setIsCommunityReportOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [editContent, setEditContent] = useState(content);
    const editorRef = useRef<MarkdownEditorHandle>(null);
    const { uploadPendingMedia, isUploading: isUploadingMedia, progress: uploadProgress } = useUploadContentMedia();
    const reportMutation = useCreateCommunityContentReport();
    const canReportToCommunity = isCommunityContext && !isAuthor;
    const isReportReasonValid = reportReason.trim().length >= 5 && reportReason.trim().length <= 500;
    const { checkMuted } = useMuteGuard(effectiveCommunityId);
    const { user } = useSelector((state: RootState) => state.auth);

    const isGlobalAdminOrMod = user?.roles?.includes('Admin') || user?.roles?.includes('Moderator');
    const isCommunityMod = isCommunityContext && canModerateCommunity;
    const canViewHiddenContent = isAuthor || isGlobalAdminOrMod || isCommunityMod;

    const status = normalizeModerationStatus(moderationStatus);
    const isHidden = status === "InReview" || status === "Flagged";

    if (isHidden && !canViewHiddenContent) {
        return null;
    }


    const handleSubmit = async () => {
        if (!editContent.trim() || editContent === '\n') return; // '\n' is newline char, not literal backslash-n
        const pendingFiles = editorRef.current?.getPendingFiles(editContent) ?? new Map<string, File>();
        let finalContent = editContent;
        const mediaIds: string[] = [];

        if (pendingFiles.size > 0) {
            try {
                const uploadResults = await uploadPendingMedia(contentType, pendingFiles);
                uploadResults.forEach(({ blobUrl, serverUrl, mediaId }) => {
                    finalContent = finalContent.replaceAll(blobUrl, serverUrl);
                    mediaIds.push(mediaId);
                });
            } catch {
                return;
            }
        }

        onUpdate(finalContent, mediaIds, () => {
            editorRef.current?.cleanup();
            setIsEditing(false);
        });
    };

    const handleCancel = () => {
        editorRef.current?.cleanup();
        setEditContent(content);
        setIsEditing(false);
    };

    const historyType: ContentHistoryKind = contentType === ContentType.Answer ? "answer" : "comment";
    const contentLabel = contentType === ContentType.Answer ? "answer" : "comment";

    const handleSubmitReport = () => {
        if (!communityId || !isReportReasonValid) return;

        reportMutation.mutate(
            {
                communityId,
                payload: {
                    contentId: id,
                    contentType,
                    reason: reportReason.trim(),
                },
            },
            {
                onSuccess: (created) => {
                    if (created) {
                        setReportReason('');
                        setIsCommunityReportOpen(false);
                    }
                },
            }
        );
    };
    const reportTargetType = contentType === ContentType.Answer ? ReportTargetType.Answer : ReportTargetType.Comment;
    const reportTargetLabel = contentType === ContentType.Answer ? "Answer" : "Comment";

    return (
        <>
            <div className="flex gap-3 sm:gap-4 group">
                <ProfileHoverCard profileId={authorId} author={author} communityId={effectiveCommunityId} showCommunityStatus={Boolean(effectiveCommunityId)} canModerateCommunity={isCommunityContext ? canModerateCommunity : false}>
                    <Link
                        href={`/profile/${authorId}`}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondary shrink-0 overflow-hidden relative border transition-all ${
                            isSystemAnswer
                                ? 'ring-2 ring-emerald-400/50 ring-offset-2 ring-offset-background dark:ring-offset-background animate-pulse border-emerald-500/30'
                                : 'border-default'
                        }`}
                    >
                        <UserAvatar avatarUrl={author?.avatarUrl} fullName={author?.fullName} className="h-full w-full border-0" />
                    </Link>
                </ProfileHoverCard>

                <div className="flex-1 min-w-0">
                    <div className={cn(
                        "border rounded-2xl rounded-tl-none inline-block max-w-full overflow-hidden transition-all",
                        isSystemAnswer
                            ? 'bg-emerald-500/[0.02] dark:bg-emerald-500/[0.03] border-emerald-500/30 dark:border-emerald-500/40 shadow-ai-md p-4 sm:p-5 relative'
                            : 'bg-card p-3 sm:p-4',
                        !isSystemAnswer && (isAccepted ? 'border-emerald-500 bg-emerald-500/5 shadow-sm' : 'border-default'),
                        isHidden && 'border-dashed'
                    )}>
                        <div className="flex items-center gap-2 mb-1">
                            <ProfileHoverCard profileId={authorId} author={author} communityId={effectiveCommunityId} showCommunityStatus={Boolean(effectiveCommunityId)} canModerateCommunity={isCommunityContext ? canModerateCommunity : false}>
                                <Link href={`/profile/${authorId}`} className="text-sm font-semibold text-heading hover:text-primary transition-colors">
                                    {author?.fullName || 'Unknown'}
                                </Link>
                            </ProfileHoverCard>
                            {isSystemAnswer && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    AI
                                </span>
                            )}
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
                        {isHidden && (
                            <ModerationBanner status={status} className="my-2 relative z-20" />
                        )}
                        <div className={cn(
                            "mt-2 min-w-0",
                            isHidden && "opacity-70 grayscale-[20%]"
                        )}>
                            {isEditing ? (
                                <>
                                    <MarkdownEditor
                                        ref={editorRef}
                                        value={editContent}
                                        onChange={(val?: string) => setEditContent(val || '')}
                                        contentType={contentType}
                                    />
                                    <div className="flex items-center justify-end px-2 py-2 sm:px-3 bg-subtle/50 mt-auto border-t border-default/50">
                                        {isUploadingMedia && uploadProgress && (
                                            <div className="mr-auto text-xs text-muted-foreground">
                                                Uploading media: {uploadProgress.current} / {uploadProgress.total}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleCancel}
                                                className="btn-ghost px-4 py-1.5 text-sm font-semibold"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSubmit}
                                                disabled={!editContent.trim() || isUpdating || isUploadingMedia}
                                                className="btn-ai disabled:opacity-50 disabled:cursor-not-allowed px-4 py-1.5 text-sm font-semibold"
                                            >
                                                {isUploadingMedia ? 'Uploading...' : (isUpdating ? 'Saving...' : 'Save')}
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
                            onClick={() => {
                                if (isCommunityContext && checkMuted('vote')) return;
                                onVote(true);
                            }}
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
                            onClick={() => {
                                if (isCommunityContext && checkMuted('vote')) return;
                                onVote(false);
                            }}
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
                                onClick={() => {
                                    if (isCommunityContext && checkMuted('reply')) return;
                                    onToggleReply?.();
                                }}
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
                                {!isAuthor && (
                                    <>
                                        <DropdownMenuItem
                                            onSelect={() => setIsReportOpen(true)}
                                            variant='destructive'
                                            className="w-full flex items-center gap-2 p-2.5 text-sm text-destructive cursor-pointer rounded-lg transition-colors font-medium"
                                        >
                                            <Flag className="w-4 h-4" />
                                            <span>Report to Site</span>
                                        </DropdownMenuItem>
                                        {canReportToCommunity && (
                                            <DropdownMenuItem
                                                onClick={() => setIsCommunityReportOpen(true)}
                                                variant='destructive'
                                                className="w-full flex items-center gap-2 p-2.5 text-sm text-destructive cursor-pointer rounded-lg transition-colors font-medium"
                                            >
                                                <Flag className="w-4 h-4" />
                                                <span>Report to Community</span>
                                            </DropdownMenuItem>
                                        )}
                                    </>
                                )}
                                {!isDisabled && (
                                    <DropdownMenuItem
                                        onClick={() => setIsHistoryOpen(true)}
                                        className="w-full flex items-center gap-2 p-2.5 text-sm text-body hover:bg-subtle hover:text-heading cursor-pointer rounded-lg transition-colors font-medium"
                                    >
                                        <History className="w-4 h-4" />
                                        <span>History</span>
                                    </DropdownMenuItem>
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
                                    </>
                                )}
                                {canDelete && !isDisabled && (
                                    <DropdownMenuItem
                                        onClick={onDelete}
                                        disabled={isDeleting}
                                        variant='destructive'
                                        className="w-full flex items-center gap-2 p-2.5 text-sm text-destructive cursor-pointer rounded-lg transition-colors font-medium"
                                    >
                                        <Trash className="w-4 h-4" />
                                        <span>Delete</span>
                                    </DropdownMenuItem>
                                )}
                                {isDisabled && (
                                    <DropdownMenuItem disabled className="text-xs text-muted-foreground p-2 text-center">
                                        {(() => {
                                            const status = normalizeModerationStatus(moderationStatus);
                                            if (status === "InReview") {
                                                return "Actions disabled while post is under review";
                                            }
                                            if (status === "Flagged") {
                                                return "Actions disabled by moderation restriction";
                                            }
                                            return "Actions disabled for restricted post";
                                        })()}
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
                <ContentHistoryOverlay
                    contentId={id}
                    type={historyType}
                    open={isHistoryOpen}
                    onClose={() => setIsHistoryOpen(false)}
                />
                {!isAuthor && (
                    <ReportDialog
                        open={isReportOpen}
                        onOpenChange={setIsReportOpen}
                        targetType={reportTargetType}
                        targetId={id}
                        targetLabel={reportTargetLabel}
                    />
                )}
            </div>
            <Dialog
                open={isCommunityReportOpen}
                onOpenChange={(open) => {
                    if (!reportMutation.isPending) setIsCommunityReportOpen(open);
                }}
            >
                <DialogContent onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle>Report to community</DialogTitle>
                        <DialogDescription>
                            Send this {contentLabel} to community moderators for review.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Textarea
                            value={reportReason}
                            onChange={(event) => setReportReason(event.target.value)}
                            maxLength={500}
                            placeholder="Describe the issue..."
                            className="min-h-28 resize-none"
                            disabled={reportMutation.isPending}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Minimum 5 characters.</span>
                            <span>{reportReason.trim().length}/500</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={reportMutation.isPending}
                            onClick={() => setIsCommunityReportOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={!isReportReasonValid || reportMutation.isPending}
                            onClick={handleSubmitReport}
                        >
                            {reportMutation.isPending ? "Submitting..." : "Submit Report"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
