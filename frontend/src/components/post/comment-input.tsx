'use client';

import { useState } from 'react';
import { MarkdownEditor } from '../editor/markdown-editor';
import { useCreateComment } from '@/hooks/comment-hooks/use-create-comment';
import { CreateCommentDTO } from '@/types/comment/create-comment-dto';
import { useCreateAnswer } from '@/hooks/answer-hooks/use-create-answer';
import Image from 'next/image';
import { CreateAnswerDTO } from '@/types/answer/create-answer-dto';

interface CommentInputProps {
    postId?: string;
    answerId?: string;
    replyToCommentId?: string;
    currentUserAvatar?: string;
    isQAPost?: boolean;
    isDisabled?: boolean;
    onSuccess?: () => void;
}

export function CommentInput({ postId, answerId, replyToCommentId, currentUserAvatar, isQAPost, isDisabled, onSuccess }: CommentInputProps) {
    const [content, setContent] = useState('');
    const { mutate: createComment, isPending: isCreatingComment } = useCreateComment();
    const { mutate: createAnswer, isPending: isCreatingAnswer } = useCreateAnswer();
    const [isExpanded, setIsExpanded] = useState(false);

    // If answerId or replyToCommentId is provided, we are creating a Comment.
    const isCreatingAnswerPost = isQAPost && !answerId && !replyToCommentId;
    const isSubmitting = isCreatingAnswerPost ? isCreatingAnswer : isCreatingComment;

    const handleSubmit = () => {
        if (!content.trim() || content === '\\n') return;

        if (isCreatingAnswerPost && postId) {
            const payload: CreateAnswerDTO = {
                content: content,
                qaPostId: postId
            }
            createAnswer(payload, {
                onSuccess: () => {
                    setContent('');
                    setIsExpanded(false);
                    onSuccess?.();
                }
            });
        } else {
            const payload: CreateCommentDTO = {
                content: content,
                postId: postId,
                answerId: answerId,
                replyToCommentId: replyToCommentId
            }
            createComment(payload, {
                onSuccess: () => {
                    setContent('');
                    setIsExpanded(false);
                    onSuccess?.();
                }
            });
        }
    };

    const handleCancel = () => {
        setContent('');
        setIsExpanded(false);
    };

    return (
        <div className="flex gap-3 sm:gap-4 mb-8">
            {/* Avatar */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 shrink-0 mt-1 border border-default overflow-hidden relative">
                {currentUserAvatar ? (
                    <Image src={currentUserAvatar} alt="Current User" fill unoptimized className="object-cover" />
                ) : (
                    <span className="w-full h-full flex items-center justify-center font-bold text-primary">U</span>
                )}
            </div>

            {/* Input Container */}
            <div className="flex-1">
                {/* 
                    Lắng nghe khối div này để biết khi nào được focus.
                */}
                <div
                    onFocusCapture={() => setIsExpanded(true)}
                    className={`bg-subtle border rounded-xl overflow-hidden transition-all flex flex-col ${isExpanded ? 'border-primary ring-1 ring-primary' : 'border-default'
                        }`}
                >
                    <div className={isExpanded ? 'block' : 'hidden md:block opacity-50 pointer-events-none blur-[1px] transition-all'}>
                        {/* Nếu chưa expand, làm mờ đi dạng demo, click vào mới rõ lên */}
                    </div>

                    {/* Render MarkdownEditor (UIW Editor) */}
                    <MarkdownEditor
                        value={content}
                        onChange={(val?: string) => setContent(val || '')}
                    />

                    {/* Bottom Action Bar */}
                    {(isExpanded || content.trim().length > 0) && (
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
                                    disabled={!content.trim() || isSubmitting}
                                    className="btn-ai disabled:opacity-50 disabled:cursor-not-allowed px-4 py-1.5 text-sm font-semibold "
                                >
                                    {isSubmitting ? 'Posting...' : 'Post'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}