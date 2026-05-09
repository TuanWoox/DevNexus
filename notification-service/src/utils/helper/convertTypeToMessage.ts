import { Notification } from "src/generated/prisma/client";
import { NotificationEventEnum } from "src/shared/enums/NotificationEventEnum";

type NotificationMessageSource = Pick<Notification, 'Type' | 'EntityTitle'>;

export function convertTypeToMessage(event: NotificationMessageSource, actor: string | undefined): string {
    const a = actor ?? 'Someone';
    const title = event.EntityTitle ? `"${event.EntityTitle}"` : 'your content';

    const messages: Record<number, string> = {
        [NotificationEventEnum.UPVOTE_POST]: `${a} upvoted your post ${title}`,
        [NotificationEventEnum.DOWNVOTE_POST]: `${a} downvoted your post ${title}`,
        [NotificationEventEnum.UPVOTE_ANSWER]: `${a} upvoted your answer`,
        [NotificationEventEnum.DOWNVOTE_ANSWER]: `${a} downvoted your answer`,
        [NotificationEventEnum.UPVOTE_COMMENT]: `${a} upvoted your comment`,
        [NotificationEventEnum.DOWNVOTE_COMMENT]: `${a} downvoted your comment`,
        [NotificationEventEnum.UPVOTE_QUESTION]: `${a} upvoted your question ${title}`,
        [NotificationEventEnum.DOWNVOTE_QUESTION]: `${a} downvoted your question ${title}`,
        [NotificationEventEnum.NEW_ANSWER]: `${a} answered your question ${title}`,
        [NotificationEventEnum.COMMENT_POST]: `${a} commented on your post ${title}`,
        [NotificationEventEnum.COMMENT_ANSWER]: `${a} commented on your answer`,
        [NotificationEventEnum.REPLY_COMMENT]: `${a} replied to your comment`,
        [NotificationEventEnum.ANSWER_ACCEPTED]: `Your answer was accepted`,
        [NotificationEventEnum.FOLLOW_USER]: `${a} started following you`,
        [NotificationEventEnum.FOLLOW_REQUEST]: `${a} sent you a follow request`,
        [NotificationEventEnum.FOLLOW_ACCEPTED]: `${a} accepted your follow request`,
        [NotificationEventEnum.COMMUNITY_INVITE]: `${a} invited you to a community`,
        [NotificationEventEnum.COMMUNITY_JOIN_REQUEST]: `${a} requested to join your community`,
        [NotificationEventEnum.COMMUNITY_POST]: `New post in your community`,
        [NotificationEventEnum.COMMUNITY_ROLE_CHANGE]: `Your role in the community has changed`,
        [NotificationEventEnum.COMMUNITY_BAN]: `You have been banned from a community`,
        [NotificationEventEnum.NEW_MESSAGE]: `${a} sent you a message`,
        [NotificationEventEnum.MESSAGE_REQUEST]: `${a} sent you a message request`,
        [NotificationEventEnum.MODERATION_RESULT]: `Your post has been reviewed`,
        [NotificationEventEnum.REPUTATION_MILESTONE]: `You reached a new reputation milestone`,
        [NotificationEventEnum.SYSTEM_ANNOUNCEMENT]: `New system announcement`,
    };

    return messages[event.Type] ?? `New notification from ${a}`;
}