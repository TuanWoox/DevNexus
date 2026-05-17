'use client';

import { useMemo } from 'react';
import { useGetCommentsByPostId } from '@/hooks/comment-hooks/use-get-comments-by-post-id';
import { Page } from '@/types/common/page';
import { SortOrderType } from '@/constants/sortOrderType';
import { CommentInput } from './comment-input';
import { Skeleton } from '../ui/skeleton';
import { SelectCommentDTO } from '@/types/comment/select-comment-dto';
import { useGetAnswersByPostId } from '@/hooks/answer-hooks/use-get-answers-by-post-id';
import { SelectAnswerDTO } from '@/types/answer/select-answer-dto';
import { useGetProfileById } from '@/hooks/profile-hooks/use-get-profile-by-id';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { AnswerItem } from './answer-item';
import { CommentItem } from './comment-item';
import { useGetPostById } from '@/hooks/post-hooks';
import { useGetQAPostById } from '@/hooks/qa-post-hooks/use-get-qa-post-by-id';
import { normalizeModerationStatus } from '@/types/post/moderation-status';

interface Props {
    postId: string;
    isQAPost: boolean;
}

export default function CommentSection({ postId, isQAPost }: Props) {
    // TODO: implement pagination for comments/answers — currently loads first 20
    const commentConfig = useMemo<Page<string>>(() => ({
        size: 20,
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
    }), []);

    const { user } = useSelector((state: RootState) => state.auth)
    const { data: userProfile } = useGetProfileById(user?.profileId as string);

    const { data: answerData, isPending: isAnswerLoading } = useGetAnswersByPostId(postId, isQAPost, commentConfig)
    const { data: commentData, isPending: isCommentLoading } = useGetCommentsByPostId(postId, !isQAPost, commentConfig);

    const { data: qaPost } = useGetQAPostById(postId, isQAPost);
    const { data: normalPost } = useGetPostById(postId, !isQAPost);
    const post = isQAPost ? qaPost : normalPost;

    const moderationStatus = normalizeModerationStatus(post?.moderationStatus);
    const isApproved = moderationStatus === "Approved";

    const commentsData = isQAPost ? answerData : commentData;
    const isLoading = isQAPost ? isAnswerLoading : isCommentLoading;

    return (
        <div className="mt-4 sm:mt-6 sm:mx-6 px-4 sm:px-0">
            <h3 className="text-lg font-bold text-heading mb-4">
                {isQAPost ? 'Answers' : 'Comments'} ({commentsData?.page?.totalElements || 0})
            </h3>

            {/* Create Comment Input */}
            {isApproved ? (
                <CommentInput postId={postId} currentUserAvatar={userProfile?.avatarUrl} isQAPost={isQAPost} />
            ) : (
                <div className="bg-muted/30 border border-dashed border-default rounded-xl p-4 text-center text-muted-foreground mb-8">
                    {isQAPost ? 'Answers' : 'Comments'} are disabled because this post is not approved.
                </div>
            )}

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
                                <div className="bg-card border border-default rounded-2xl rounded-tl-none p-3 sm:p-4 inline-block w-full sm:w-3/4 lg:w-2/3">
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
                        isQAPost ? (
                            <AnswerItem 
                                key={comment.id} 
                                answer={comment as SelectAnswerDTO} 
                                currentUserId={user?.profileId as string} 
                                isDisabled={!isApproved}
                                isQuestionAuthor={post?.authorId === user?.profileId}
                            />
                        ) : (
                            <CommentItem 
                                key={comment.id} 
                                comment={comment as SelectCommentDTO} 
                                currentUserId={user?.profileId as string} 
                                isDisabled={!isApproved}
                            />
                        )
                    ))}
                </div>
            )}
        </div>
    );
}



