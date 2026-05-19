'use client';

import { SelectAnswerDTO } from '@/types/answer/select-answer-dto';
import { useUpdateVoteByAnswerId } from '@/hooks/vote-hooks/use-update-vote-by-answer-id';
import { useDeleteAnswerById } from '@/hooks/answer-hooks/use-delete-answer-by-id';
import { useUpdateAnswer } from '@/hooks/answer-hooks/use-update-answer';
import { useAcceptAnswerById } from '@/hooks/answer-hooks/use-accept-answer-by-id';
import { UpdateAnswerDTO } from '@/types/answer/update-answer-dto';
import { BaseReplyItem } from './base-reply-item';
import { useState } from 'react';
import { CommentInput } from './comment-input';
import { CommentItem } from './comment-item';
import { SelectCommentDTO } from '@/types/comment/select-comment-dto';

export function AnswerItem({ answer, currentUserId, currentUserAvatar, isDisabled, isQuestionAuthor }: { answer: SelectAnswerDTO, currentUserId: string, currentUserAvatar?: string, isDisabled?: boolean, isQuestionAuthor?: boolean }) {
    const { mutate: updateVote, isPending: isVotePending } = useUpdateVoteByAnswerId(answer.id);
    const { mutate: deleteAnswer, isPending: isDeletingAnswer } = useDeleteAnswerById();
    const { mutate: updateAnswer, isPending: isUpdatingAnswer } = useUpdateAnswer();
    const { mutate: acceptAnswer, isPending: isAcceptingAnswer } = useAcceptAnswerById();
    const [isReplying, setIsReplying] = useState(false);

    return (
        <div className="flex flex-col gap-4">
            <BaseReplyItem
                id={answer.id}
                content={answer.content}
                upvoteCount={answer.upvoteCount}
                downvoteCount={answer.downvoteCount}
                dateModified={answer.dateModified as string}
                author={answer.author}
                authorId={answer.authorId}
                currentUserId={currentUserId}
                currentUserVote={answer.currentUserVote}
                onVote={(isUpvote) => updateVote({ isUpvote })}
                isVotePending={isVotePending}
                onDelete={() => deleteAnswer(answer.id)}
                isDeleting={isDeletingAnswer}
                onUpdate={(newContent, onSuccess) => {
                    const payload: UpdateAnswerDTO = { id: answer.id, content: newContent };
                    updateAnswer(payload, { onSuccess });
                }}
                isUpdating={isUpdatingAnswer}
                isDisabled={isDisabled}
                isAccepted={answer.isAccepted}
                onAccept={() => acceptAnswer(answer.id)}
                canAccept={isQuestionAuthor && !answer.isAccepted}
                isAccepting={isAcceptingAnswer}
                isReplying={isReplying}
                onToggleReply={() => setIsReplying(!isReplying)}
                replyInput={
                    <CommentInput
                        answerId={answer.id}
                        currentUserAvatar={currentUserAvatar}
                        onSuccess={() => setIsReplying(false)}
                    />
                }
            />

            {/* Render Comments of Answer */}
            {answer.replies && answer.replies.length > 0 && (
                <div className="ml-8 sm:ml-12 border-l-2 border-default/50 pl-4 space-y-6">
                    {answer.replies.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment as SelectCommentDTO}
                            currentUserId={currentUserId}
                            currentUserAvatar={currentUserAvatar}
                            isDisabled={isDisabled}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
