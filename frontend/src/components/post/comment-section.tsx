'use client';

import { useMemo } from 'react';
import { useGetCommentsByPostIdInfinite } from '@/hooks/comment-hooks/use-get-comments-by-post-id-infinite';
import { SortOrderType } from '@/constants/sortOrderType';
import { CommentInput } from './comment-input';
import { Skeleton } from '../ui/skeleton';
import { SelectCommentDTO } from '@/types/comment/select-comment-dto';
import { useGetAnswersByPostIdInfinite } from '@/hooks/answer-hooks/use-get-answers-by-post-id-infinite';
import { SelectAnswerDTO } from '@/types/answer/select-answer-dto';
import { useGetProfileById } from '@/hooks/profile-hooks/use-get-profile-by-id';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { AnswerItem } from './answer-item';
import { AIAnswerSection } from './ai-answer-section';
import { CommentItem } from './comment-item';
import { useGetPostById } from '@/hooks/post-hooks';
import { useGetQAPostById } from '@/hooks/qa-post-hooks/use-get-qa-post-by-id';
import { normalizeModerationStatus, canInteractWithModeratedContent } from '@/types/post/moderation-status';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { Loader2 } from 'lucide-react';
import { SelectPostDTO } from '@/types/post/select-post-dto';
import { SelectQAPostDTO } from '@/types/qa-post/select-qa-post-dto';
import { useGetCommunityById } from '@/hooks/community-hooks/use-get-community-by-id';
import { CommunityApprovalStatus, normalizeCommunityApprovalStatus } from '@/types/enums/community-approval-status';

interface Props {
    postId: string;
    isQAPost: boolean;
    context?: "personal" | "community";
    routeCommunityId?: string;
}

export default function CommentSection({ postId, isQAPost, context = "personal", routeCommunityId }: Props) {
    const isCommunityContext = context === "community";
    const itemsPayload = useMemo(() => ({
        totalElements: 0,
        orders: [
            { sort: 'dateModified', sortDir: SortOrderType.DESC, dynamicProperty: '', delimiter: '', dataType: '' }
        ],
        filter: [],
        selected: [],
    }), []);

    const { user } = useSelector((state: RootState) => state.auth);
    const { data: userProfile } = useGetProfileById(user?.profileId as string);

    const { data: qaPost, isError: isQAError } = useGetQAPostById(postId, isQAPost);
    const { data: normalPost, isError: isNormalError } = useGetPostById(postId, !isQAPost);
    const post = isQAPost ? qaPost : normalPost;

    const {
        data: answerData,
        isPending: isAnswerLoading,
        hasNextPage: hasNextPageAnswer,
        fetchNextPage: fetchNextPageAnswer,
        isFetchingNextPage: isFetchingNextPageAnswer
    } = useGetAnswersByPostIdInfinite(postId, isQAPost && !!post, itemsPayload);

    const {
        data: commentData,
        isPending: isCommentLoading,
        hasNextPage: hasNextPageComment,
        fetchNextPage: fetchNextPageComment,
        isFetchingNextPage: isFetchingNextPageComment
    } = useGetCommentsByPostIdInfinite(postId, !isQAPost && !!post, itemsPayload);
    const communityId = post?.communityId;
    const effectiveCommunityId = isCommunityContext ? (routeCommunityId ?? communityId) : undefined;
    const { data: community } = useGetCommunityById(effectiveCommunityId ?? '', Boolean(effectiveCommunityId));
    const canModerateCommunity =
        community?.currentUserRole === "Owner" ||
        community?.currentUserRole === "OWNER" ||
        community?.currentUserRole === "Moderator" ||
        community?.currentUserRole === "MODERATOR";
    const isError = isQAPost ? isQAError : isNormalError;

    const isLoading = isQAPost ? isAnswerLoading : isCommentLoading;
    const hasNextPage = isQAPost ? hasNextPageAnswer : hasNextPageComment;
    const isFetchingNextPage = isQAPost ? isFetchingNextPageAnswer : isFetchingNextPageComment;
    const fetchNextPage = isQAPost ? fetchNextPageAnswer : fetchNextPageComment;

    const loadMoreRef = useIntersectionObserver(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    });

    if (isError || (!post && !isAnswerLoading && !isCommentLoading)) {
        return null;
    }

    const moderationStatus = normalizeModerationStatus(post?.moderationStatus);
    const communityApprovalStatus = normalizeCommunityApprovalStatus(post?.communityApprovalStatus) ?? (post?.communityId ? CommunityApprovalStatus.Pending : null);
    const isApproved = canInteractWithModeratedContent(moderationStatus) &&
        (!post?.communityId ||
            communityApprovalStatus == null ||
            communityApprovalStatus === CommunityApprovalStatus.Approved);

    const getDisabledMessage = () => {
        if (moderationStatus === "InReview") {
            return isQAPost
                ? "Answers are disabled while this post is under review."
                : "Comments are disabled while this post is under review.";
        }
        if (moderationStatus === "Flagged") {
            return isQAPost
                ? "Answers are disabled because this post was restricted by moderation."
                : "Comments are disabled because this post was restricted by moderation.";
        }
        if (post?.communityId && communityApprovalStatus === CommunityApprovalStatus.Rejected) {
            return isQAPost
                ? "Answers are disabled because this post was rejected by community moderation."
                : "Comments are disabled because this post was rejected by community moderation.";
        }
        if (post?.communityId && communityApprovalStatus === CommunityApprovalStatus.Pending) {
            return isQAPost
                ? "Answers are disabled because this post is pending community approval."
                : "Comments are disabled because this post is pending community approval.";
        }
        return isQAPost
            ? "Answers are disabled because this content is restricted by moderation."
            : "Comments are disabled because this content is restricted by moderation.";
    };

    const items = isQAPost
        ? answerData?.pages?.flatMap(p => p?.data ?? []) || []
        : commentData?.pages?.flatMap(p => p?.data ?? []) || [];
    const aiAnswers = isQAPost
        ? (items as SelectAnswerDTO[]).filter(answer => answer.isSystemAnswer)
        : [];
    const communityAnswers = isQAPost
        ? (items as SelectAnswerDTO[]).filter(answer => !answer.isSystemAnswer)
        : [];

    const totalElements = isQAPost
        ? (post as SelectQAPostDTO)?.answerCount ?? 0
        : (post as SelectPostDTO)?.commentCount ?? 0;

    return (
        <div className="mt-4 sm:mt-6 sm:mx-6 px-4 sm:px-0">
            <h3 className="text-lg font-bold text-heading mb-4">
                {isQAPost ? 'Answers' : 'Comments'} ({totalElements})
            </h3>

            {/* Create Comment Input */}
            {isApproved ? (
                <CommentInput
                    postId={postId}
                    currentUserAvatar={userProfile?.avatarUrl}
                    isQAPost={isQAPost}
                    communityId={effectiveCommunityId}
                    context={context}
                />
            ) : (
                <div className="bg-muted/30 border border-dashed border-default rounded-xl p-4 text-center text-muted-foreground mb-8">
                    {getDisabledMessage()}
                </div>
            )}

            {/* Comment List */}
            {isLoading ? (
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
                    {isQAPost ? (
                        <>
                            {communityAnswers.length > 0 && aiAnswers.length > 0 && (
                                <h4 className="text-sm font-bold text-heading">Community Answers</h4>
                            )}

                            {communityAnswers.map((answer) => (
                                <AnswerItem
                                    key={answer.id}
                                    answer={answer}
                                    currentUserId={user?.profileId as string}
                                    currentUserAvatar={userProfile?.avatarUrl}
                                    isDisabled={!isApproved}
                                    moderationStatus={moderationStatus}
                                    isQuestionAuthor={post?.authorId === user?.profileId}
                                    communityId={effectiveCommunityId}
                                    canModerateCommunity={isCommunityContext ? canModerateCommunity : false}
                                    context={context}
                                />
                            ))}

                            <AIAnswerSection
                                answers={aiAnswers}
                                currentUserId={user?.profileId as string}
                                currentUserAvatar={userProfile?.avatarUrl}
                                isDisabled={!isApproved}
                                moderationStatus={moderationStatus}
                                isQuestionAuthor={post?.authorId === user?.profileId}
                                communityId={effectiveCommunityId}
                                canModerateCommunity={isCommunityContext ? canModerateCommunity : false}
                                context={context}
                            />
                        </>
                    ) : (
                        items.map((comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment as SelectCommentDTO}
                                currentUserId={user?.profileId as string}
                                currentUserAvatar={userProfile?.avatarUrl}
                                isDisabled={!isApproved}
                                moderationStatus={moderationStatus}
                                communityId={effectiveCommunityId}
                                canModerateCommunity={isCommunityContext ? canModerateCommunity : false}
                                context={context}
                            />
                        ))
                    )}

                    {/* Infinite Scroll Sentinel */}
                    <div ref={loadMoreRef} className="h-4 w-full flex justify-center items-center py-4">
                        {isFetchingNextPage && <Loader2 className="w-6 h-6 animate-spin text-primary" />}
                    </div>
                </div>
            )}
        </div>
    );
}
