'use client';

import { useRef, useState } from 'react';
import { MarkdownEditor, MarkdownEditorHandle } from '../editor/markdown-editor';
import { useCreateComment } from '@/hooks/comment-hooks/use-create-comment';
import { CreateCommentDTO } from '@/types/comment/create-comment-dto';
import { useCreateAnswer } from '@/hooks/answer-hooks/use-create-answer';
import Image from 'next/image';
import { CreateAnswerDTO } from '@/types/answer/create-answer-dto';
import { ContentType } from '@/types/content-media/content-type';
import { useUploadContentMedia } from '@/hooks/media/useUploadContentMedia';

interface CommentInputProps {
    postId: string;
    currentUserAvatar?: string;
    isQAPost: boolean;
    isDisabled?: boolean;
}

export function CommentInput({ postId, currentUserAvatar, isQAPost, isDisabled }: CommentInputProps) {
    const [content, setContent] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const editorRef = useRef<MarkdownEditorHandle>(null);
    const { mutate: createComment, isPending: isCreatingComment } = useCreateComment();
    const { mutate: createAnswer, isPending: isCreatingAnswer } = useCreateAnswer();
    const { uploadPendingMedia, isUploading: isUploadingMedia, progress: uploadProgress } = useUploadContentMedia();

    const isSubmitting = isQAPost ? isCreatingAnswer : isCreatingComment;
    const contentType = isQAPost ? ContentType.Answer : ContentType.Comment;

    const handleSubmit = async () => {
        if (!content.trim() || content === '\n') return;

        const pendingFiles = editorRef.current?.getPendingFiles(content) ?? new Map();
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

        if (isQAPost) {
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
                }
            });
        } else {
            const payload: CreateCommentDTO = {
                content: finalContent,
                postId,
                mediaIds
            };
            createComment(payload, {
                onSuccess: () => {
                    editorRef.current?.cleanup();
                    setContent('');
                    setIsExpanded(false);
                }
            });
        }
    };

    const handleCancel = () => {
        editorRef.current?.cleanup();
        setContent('');
        setIsExpanded(false);
    };

    return (
        <div className="flex gap-3 sm:gap-4 mb-8">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 shrink-0 mt-1 border border-default overflow-hidden relative">
                {currentUserAvatar ? (
                    <Image src={currentUserAvatar} alt="Current User" fill unoptimized className="object-cover" />
                ) : (
                    <span className="w-full h-full flex items-center justify-center font-bold text-primary">U</span>
                )}
            </div>

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
