'use client';

import { SelectCommentDTO } from '@/types/comment/select-comment-dto';
import { useUpdateVoteByCommentId } from '@/hooks/vote-hooks/use-update-vote-by-comment-id';
import { useDeleteComment } from '@/hooks/comment-hooks/use-delete-comment';
import { useUpdateComment } from '@/hooks/comment-hooks/use-update-comment';
import { UpdateCommentDTO } from '@/types/comment/update-comment-dto';
import { BaseReplyItem } from './base-reply-item';
import { ContentType } from '@/types/content-media/content-type';
import { useState } from 'react';
import { CommentInput } from './comment-input';

export function CommentItem({ comment, currentUserId, currentUserAvatar, isDisabled, communityId, canModerateCommunity, context = "personal" }: { comment: SelectCommentDTO, currentUserId: string, currentUserAvatar?: string, isDisabled?: boolean, communityId?: string | null, canModerateCommunity?: boolean, context?: "personal" | "community" }) {
    const { mutate: updateVote, isPending: isVotePending } = useUpdateVoteByCommentId(comment.id);
    const { mutate: deleteComment, isPending: isDeletingComment } = useDeleteComment();
    const { mutate: updateComment, isPending: isUpdatingComment } = useUpdateComment();
    const [isReplying, setIsReplying] = useState(false);

    return (
        <div className="flex flex-col gap-4">
            <BaseReplyItem
                id={comment.id}
                content={comment.content}
                upvoteCount={comment.upvoteCount}
                downvoteCount={comment.downvoteCount}
                dateModified={comment.dateModified as string}
                author={comment.author}
                authorId={comment.authorId}
                currentUserId={currentUserId}
                currentUserVote={comment.currentUserVote}
                onVote={(isUpvote) => updateVote({ isUpvote })}
                isVotePending={isVotePending}
                onDelete={() => deleteComment(comment.id)}
                isDeleting={isDeletingComment}
                contentType={ContentType.Comment}
                onUpdate={(newContent, mediaIds, onSuccess) => {
                    const payload: UpdateCommentDTO = { id: comment.id, content: newContent, mediaIds };
                    updateComment(payload, { onSuccess });
                }}
                isUpdating={isUpdatingComment}
                isDisabled={isDisabled}
                communityId={communityId}
                canModerateCommunity={canModerateCommunity}
                context={context}
                isReplying={isReplying}
                onToggleReply={() => setIsReplying(!isReplying)}
                hideReplyButton={!!comment.answerId || !!comment.replyToCommentId}
                replyInput={
                    <CommentInput
                        postId={comment.postId}
                        answerId={comment.answerId}
                        replyToCommentId={comment.id}
                        currentUserAvatar={currentUserAvatar}
                        communityId={communityId}
                        context={context}
                        onSuccess={() => setIsReplying(false)}
                    />
                }
            />
            {comment.replies && comment.replies.length > 0 && (
                <div className="ml-8 sm:ml-12 border-l-2 border-default/50 pl-4 space-y-6">
                    {comment.replies.map(reply => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            currentUserId={currentUserId}
                            currentUserAvatar={currentUserAvatar}
                            isDisabled={isDisabled}
                            communityId={communityId}
                            canModerateCommunity={canModerateCommunity}
                            context={context}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
