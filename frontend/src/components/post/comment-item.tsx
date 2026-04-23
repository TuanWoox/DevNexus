'use client';

import { SelectCommentDTO } from '@/types/comment/select-comment-dto';
import { useUpdateVoteByCommentId } from '@/hooks/vote-hooks/use-update-vote-by-comment-id';
import { useDeleteComment } from '@/hooks/comment-hooks/use-delete-comment';
import { useUpdateComment } from '@/hooks/comment-hooks/use-update-comment';
import { UpdateCommentDTO } from '@/types/comment/update-comment-dto';
import { BaseReplyItem } from './base-reply-item';

export function CommentItem({ comment, currentUserId }: { comment: SelectCommentDTO, currentUserId: string }) {
    const { mutate: updateVote, isPending: isVotePending } = useUpdateVoteByCommentId(comment.id);
    const { mutate: deleteComment, isPending: isDeletingComment } = useDeleteComment();
    const { mutate: updateComment, isPending: isUpdatingComment } = useUpdateComment();

    return (
        <BaseReplyItem
            id={comment.id}
            content={comment.content}
            upvoteCount={comment.upvoteCount}
            downvoteCount={comment.downvoteCount}
            dateModified={comment.dateModified as string}
            author={comment.author}
            authorId={comment.authorId}
            currentUserId={currentUserId}
            onVote={(isUpvote) => updateVote({ isUpvote })}
            isVotePending={isVotePending}
            onDelete={() => deleteComment(comment.id)}
            isDeleting={isDeletingComment}
            onUpdate={(newContent, onSuccess) => {
                const payload: UpdateCommentDTO = { id: comment.id, content: newContent };
                updateComment(payload, { onSuccess });
            }}
            isUpdating={isUpdatingComment}
        />
    );
}
