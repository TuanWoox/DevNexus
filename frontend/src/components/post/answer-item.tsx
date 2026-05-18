'use client';

import { SelectAnswerDTO } from '@/types/answer/select-answer-dto';
import { useUpdateVoteByAnswerId } from '@/hooks/vote-hooks/use-update-vote-by-answer-id';
import { useDeleteAnswerById } from '@/hooks/answer-hooks/use-delete-answer-by-id';
import { useUpdateAnswer } from '@/hooks/answer-hooks/use-update-answer';
import { useAcceptAnswerById } from '@/hooks/answer-hooks/use-accept-answer-by-id';
import { UpdateAnswerDTO } from '@/types/answer/update-answer-dto';
import { BaseReplyItem } from './base-reply-item';
import { ContentType } from '@/types/content-media/content-type';

export function AnswerItem({ answer, currentUserId, isDisabled, isQuestionAuthor }: { answer: SelectAnswerDTO, currentUserId: string, isDisabled?: boolean, isQuestionAuthor?: boolean }) {
    const { mutate: updateVote, isPending: isVotePending } = useUpdateVoteByAnswerId(answer.id);
    const { mutate: deleteAnswer, isPending: isDeletingAnswer } = useDeleteAnswerById();
    const { mutate: updateAnswer, isPending: isUpdatingAnswer } = useUpdateAnswer();
    const { mutate: acceptAnswer, isPending: isAcceptingAnswer } = useAcceptAnswerById();

    return (
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
            contentType={ContentType.Answer}
            onUpdate={(newContent, mediaIds, onSuccess) => {
                const payload: UpdateAnswerDTO = { id: answer.id, content: newContent, mediaIds };
                updateAnswer(payload, { onSuccess });
            }}
            isUpdating={isUpdatingAnswer}
            isDisabled={isDisabled}
            isAccepted={answer.isAccepted}
            onAccept={() => acceptAnswer(answer.id)}
            canAccept={isQuestionAuthor && !answer.isAccepted}
            isAccepting={isAcceptingAnswer}
        />
    );
}
