'use client';

import { useState } from 'react';
import { ArrowBigUp, ArrowBigDown, MoreHorizontal } from 'lucide-react';
import { useGetCommentsByPostId } from '@/hooks/comment-hooks/use-get-comments-by-post-id';
import { Page } from '@/types/common/page';
import { SortOrderType } from '@/constants/sortOrderType';
import { CommentInput } from './comment-input';
import { Skeleton } from '../ui/skeleton';
import { useUpdateVoteByCommentId } from '@/hooks/vote-hooks/use-update-vote-by-comment-id';
import { SelectCommentDTO } from '@/types/comment/select-comment-dto';
import { useGetAnswersByPostId } from '@/hooks/answer-hooks/use-get-answers-by-post-id';
import { SelectAnswerDTO } from '@/types/answer/select-answer-dto';
import { useUpdateVoteByAnswerId } from '@/hooks/vote-hooks/use-update-vote-by-answer-id';
import { useGetProfileById } from '@/hooks/profile-hooks/use-get-profile-by-id';

interface Props {
    postId: string;
    isQAPost: boolean;
}

export default function CommentSection({ postId, isQAPost }: Props) {
    const [commentConfig] = useState<Page<string>>({
        size: -1,
        pageNumber: 0,
        totalElements: 0,
        orders: [
            {
                sort: 'dateCreated',
                sortDir: SortOrderType.DESC,
                dynamicProperty: '',
                delimiter: '',
                dataType: ''
            }
        ],
        filter: [],
        selected: []
    });

    const { data: answerData, isPending: isAnswerLoading } = useGetAnswersByPostId(postId, isQAPost, commentConfig)
    const { data: commentData, isPending: isCommentLoading } = useGetCommentsByPostId(postId, !isQAPost, commentConfig);

    const commentsData = isQAPost ? answerData : commentData;
    const isLoading = isQAPost ? isAnswerLoading : isCommentLoading;

    // TODO: Bỏ phần mock này khi đã có Auth
    const MOCK_CURRENT_USER_AVATAR = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfE8XWOVe86hLGi8m9mgPTsva_KWjTHbT9iQ&s";

    return (
        <div className="mt-4 sm:mt-6 sm:mx-6 px-4 sm:px-0">
            <h3 className="text-lg font-bold text-heading mb-4">
                {isQAPost ? 'Answers' : 'Comments'} ({commentsData?.page?.totalElements || 0})
            </h3>

            {/* Create Comment Input */}
            <CommentInput postId={postId} currentUserAvatar={MOCK_CURRENT_USER_AVATAR} />

            {/* Comment List */}
            {isLoading ? (
                /* SKELETON LOADING STATE */
                <div className="space-y-6">
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="flex gap-3 sm:gap-4">
                            {/* Avatar Skeleton */}
                            <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shrink-0" />

                            <div className="flex-1">
                                {/* Comment Content Box Skeleton */}
                                <div className="bg-subtle border border-default rounded-2xl rounded-tl-none p-3 sm:p-4 inline-block w-full sm:w-3/4 lg:w-2/3">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Skeleton className="h-4 w-24 sm:w-32" />
                                        <Skeleton className="h-3 w-16 sm:w-20" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-5/6" />
                                    </div>
                                </div>

                                {/* Actions Skeleton */}
                                <div className="flex items-center gap-4 mt-2 ml-2">
                                    <Skeleton className="h-4 w-10 rounded-md" />
                                    <Skeleton className="h-4 w-8 rounded-md" />
                                    <Skeleton className="h-4 w-12 rounded-md" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-6">
                    {commentsData?.data?.map((comment) => (
                        isQAPost ? <AnswerItem key={comment.id} answer={comment as SelectAnswerDTO} /> : <CommentItem key={comment.id} comment={comment as SelectCommentDTO} />
                    ))}
                </div>
            )}
        </div>
    );
}

function CommentItem({ comment }: { comment: SelectCommentDTO }) {
    const { mutate: updateVote, isPending: isVotePending } = useUpdateVoteByCommentId(comment.id);

    const handleVote = (isUpvote: boolean) => {
        updateVote({ isUpvote });
    };

    return (
        <div className="flex gap-3 sm:gap-4 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondary shrink-0 overflow-hidden border border-default">
                {comment.author?.avatarUrl ? (
                    <img src={comment.author.avatarUrl} alt={comment.author.fullName} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-heading">
                        {comment.author?.fullName?.charAt(0) || 'U'}
                    </div>
                )}
            </div>

            <div className="flex-1">
                <div className="bg-subtle border border-default rounded-2xl rounded-tl-none p-3 sm:p-4 inline-block max-w-full">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-heading text-sm">
                            {comment.author?.fullName || 'Anonymous'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {new Date(comment.dateCreated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <p className="text-body text-sm sm:text-base whitespace-pre-wrap">
                        {comment.content}
                    </p>
                </div>

                <div className="flex items-center gap-4 mt-1.5 ml-2">
                    <button
                        onClick={() => handleVote(true)}
                        disabled={isVotePending}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-emerald-500 disabled:opacity-50 font-medium transition-colors"
                    >
                        <ArrowBigUp className="w-4 h-4" />
                        {comment.upvoteCount}
                    </button>
                    <button
                        onClick={() => handleVote(false)}
                        disabled={isVotePending}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-rose-500 disabled:opacity-50 font-medium transition-colors"
                    >
                        <ArrowBigDown className="w-4 h-4" />
                        {comment.downvoteCount}
                    </button>
                    <button className="text-xs text-muted-foreground hover:text-heading font-medium transition-colors">
                        Reply
                    </button>
                    <button className="text-xs text-muted-foreground hover:text-heading opacity-0 group-hover:opacity-100 transition-opacity p-1">
                        <MoreHorizontal className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function AnswerItem({ answer }: { answer: SelectAnswerDTO }) {
    const { mutate: updateVote, isPending: isVotePending } = useUpdateVoteByAnswerId(answer.id);
    const { data: author } = useGetProfileById(answer.authorId);

    const handleVote = (isUpvote: boolean) => {
        updateVote({ isUpvote });
    };

    return (
        <div className="flex gap-3 sm:gap-4 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondary shrink-0 overflow-hidden border border-default">
                {author?.avatarUrl ? (
                    <img src={author.avatarUrl} alt={author.fullName} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-heading">
                        {author?.fullName?.charAt(0) || 'U'}
                    </div>
                )}
            </div>

            <div className="flex-1">
                <div className="bg-subtle border border-default rounded-2xl rounded-tl-none p-3 sm:p-4 inline-block max-w-full">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-heading text-sm">
                            {author?.fullName || 'Anonymous'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {new Date(answer.dateCreated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <p className="text-body text-sm sm:text-base whitespace-pre-wrap">
                        {answer.content}
                    </p>
                </div>

                <div className="flex items-center gap-4 mt-1.5 ml-2">
                    <button
                        onClick={() => handleVote(true)}
                        disabled={isVotePending}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-emerald-500 disabled:opacity-50 font-medium transition-colors"
                    >
                        <ArrowBigUp className="w-4 h-4" />
                        {answer.upvoteCount}
                    </button>
                    <button
                        onClick={() => handleVote(false)}
                        disabled={isVotePending}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-rose-500 disabled:opacity-50 font-medium transition-colors"
                    >
                        <ArrowBigDown className="w-4 h-4" />
                        {answer.downvoteCount}
                    </button>
                    <button className="text-xs text-muted-foreground hover:text-heading font-medium transition-colors">
                        Reply
                    </button>
                    <button className="text-xs text-muted-foreground hover:text-heading opacity-0 group-hover:opacity-100 transition-opacity p-1">
                        <MoreHorizontal className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
}
