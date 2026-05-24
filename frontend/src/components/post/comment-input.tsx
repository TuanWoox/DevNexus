'use client';

import { useRef, useState } from 'react';
import { MarkdownEditor, MarkdownEditorHandle } from '../editor/markdown-editor';
import { useCreateComment } from '@/hooks/comment-hooks/use-create-comment';
import { CreateCommentDTO } from '@/types/comment/create-comment-dto';
import { useCreateAnswer } from '@/hooks/answer-hooks/use-create-answer';
import { CreateAnswerDTO } from '@/types/answer/create-answer-dto';
import { ContentType } from '@/types/content-media/content-type';
import { useUploadContentMedia } from '@/hooks/media/useUploadContentMedia';
import { UserAvatar } from '@/components/shared/user-avatar';
import { AlertTriangle } from 'lucide-react';
import { useMuteGuard } from '@/hooks/community-mute-hooks/use-mute-guard';

interface CommentInputProps {
    postId?: string;
    answerId?: string;
    replyToCommentId?: string;
    currentUserAvatar?: string;
    isQAPost?: boolean;
    isDisabled?: boolean;
    communityId?: string | null;
    context?: "personal" | "community";
    onSuccess?: () => void;
}

export function CommentInput({ postId, answerId, replyToCommentId, currentUserAvatar, isQAPost, isDisabled, communityId, context = "personal", onSuccess }: CommentInputProps) {
    const [content, setContent] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const editorRef = useRef<MarkdownEditorHandle>(null);
    const { mutate: createComment, isPending: isCreatingComment } = useCreateComment();
    const { mutate: createAnswer, isPending: isCreatingAnswer } = useCreateAnswer();
    const { uploadPendingMedia, isUploading: isUploadingMedia, progress: uploadProgress } = useUploadContentMedia();

    // If answerId or replyToCommentId is provided, we are creating a Comment.
    const isCreatingAnswerPost = isQAPost && !answerId && !replyToCommentId;
    const isSubmitting = isCreatingAnswerPost ? isCreatingAnswer : isCreatingComment;
    const contentType = isQAPost ? ContentType.Answer : ContentType.Comment;
    const isCommunityContext = context === "community" && Boolean(communityId);
    const effectiveCommunityId = isCommunityContext ? communityId : undefined;
    const { checkMuted, isMuted } = useMuteGuard(effectiveCommunityId);
    const mutedAction = isCreatingAnswerPost ? 'answer questions in this community' : 'comment in this community';

    const handleSubmit = async () => {
        if (!content.trim() || content === '\n') return;
        if (isCommunityContext && checkMuted(isCreatingAnswerPost ? 'answer questions' : 'comment')) return;

        const pendingFiles = editorRef.current?.getPendingFiles(content) ?? new Map<string, File>();
        let finalContent = content;
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

        if (isCreatingAnswerPost && postId) {
            const payload: CreateAnswerDTO = {
                content: finalContent,
                qaPostId: postId,
                mediaIds
            };
            createAnswer(payload, {
                onSuccess: () => {
                    editorRef.current?.cleanup();
                    setContent('');
                    setIsExpanded(false);
                    onSuccess?.();
                }
            });
        } else {
            const payload: CreateCommentDTO = {
                content: finalContent,
                postId: postId,
                answerId: answerId,
                replyToCommentId: replyToCommentId,
                mediaIds,
            };
            createComment(payload, {
                onSuccess: () => {
                    editorRef.current?.cleanup();
                    setContent('');
                    setIsExpanded(false);
                    onSuccess?.();
                }
            });
        }
    };

    const handleCancel = () => {
        editorRef.current?.cleanup();
        setContent('');
        setIsExpanded(false);
    };

    if (isCommunityContext && isMuted) {
        return (
            <div className="mb-8 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-sm font-medium">You are muted and cannot {mutedAction}.</p>
            </div>
        );
    }

    return (
        <div className="flex gap-3 sm:gap-4 mb-8">
            <UserAvatar avatarUrl={currentUserAvatar} fullName="Current User" className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 mt-1 border border-default" />

            <div className="flex-1">
                <div
                    onFocusCapture={() => setIsExpanded(true)}
                    className={`bg-subtle border rounded-xl overflow-hidden transition-all flex flex-col ${isExpanded ? 'border-primary ring-1 ring-primary' : 'border-default'
                        }`}
                >
                    <div className={isExpanded ? 'block' : 'hidden md:block opacity-50 pointer-events-none blur-[1px] transition-all'} />

                    <MarkdownEditor
                        ref={editorRef}
                        value={content}
                        onChange={(val?: string) => setContent(val || '')}
                        contentType={contentType}
                    />

                    {(isExpanded || content.trim().length > 0) && (
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
                                    disabled={!content.trim() || isSubmitting || isUploadingMedia || isDisabled}
                                    className="btn-ai disabled:opacity-50 disabled:cursor-not-allowed px-4 py-1.5 text-sm font-semibold "
                                >
                                    {isUploadingMedia ? 'Uploading...' : (isSubmitting ? 'Posting...' : 'Post')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
