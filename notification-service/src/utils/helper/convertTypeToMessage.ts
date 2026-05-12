import { Notification } from "src/generated/prisma/client";
import { NotificationEventEnum } from "src/shared/enums/NotificationEventEnum";

type NotificationMessageSource = Pick<Notification, 'Type' | 'EntityTitle' | 'AggregatedCount'>;

export function convertTypeToMessage(event: NotificationMessageSource, actor: string | undefined): string {
    const a = actor ?? 'Someone';
    const title = event.EntityTitle ? `"${event.EntityTitle}"` : 'your content';
    const count = event.AggregatedCount ?? 1;
    const others = count > 1 ? ` and ${count - 1} other${count > 2 ? 's' : ''}` : '';

    const messages: Record<number, string> = {
        [NotificationEventEnum.UPVOTE_POST]: `${a}${others} upvoted your post ${title}`,
        [NotificationEventEnum.DOWNVOTE_POST]: `${a}${others} downvoted your post ${title}`,
        [NotificationEventEnum.UPVOTE_ANSWER]: `${a}${others} upvoted your answer`,
        [NotificationEventEnum.DOWNVOTE_ANSWER]: `${a}${others} downvoted your answer`,
        [NotificationEventEnum.UPVOTE_COMMENT]: `${a}${others} upvoted your comment`,
        [NotificationEventEnum.DOWNVOTE_COMMENT]: `${a}${others} downvoted your comment`,
        [NotificationEventEnum.UPVOTE_QUESTION]: `${a}${others} upvoted your question ${title}`,
        [NotificationEventEnum.DOWNVOTE_QUESTION]: `${a}${others} downvoted your question ${title}`,
        [NotificationEventEnum.NEW_ANSWER]: `${a}${others} answered your question ${title}`,
        [NotificationEventEnum.COMMENT_POST]: `${a}${others} commented on your post ${title}`,
        [NotificationEventEnum.COMMENT_QUESTION]: `${a}${others} commented on your question ${title}`,
        [NotificationEventEnum.COMMENT_ANSWER]: `${a}${others} commented on your answer`,
        [NotificationEventEnum.REPLY_COMMENT]: `${a}${others} replied to your comment`,
        [NotificationEventEnum.ANSWER_ACCEPTED]: `Your answer was accepted`,
        [NotificationEventEnum.FOLLOW_USER]: `${a}${others} started following you`,
        [NotificationEventEnum.FOLLOW_REQUEST]: `${a}${others} sent you a follow request`,
        [NotificationEventEnum.FOLLOW_ACCEPTED]: `${a} accepted your follow request`,
        [NotificationEventEnum.COMMUNITY_INVITE]: `${a}${others} invited you to a community`,
        [NotificationEventEnum.COMMUNITY_JOIN_REQUEST]: `${a}${others} requested to join your community`,
        [NotificationEventEnum.COMMUNITY_POST]: `New post in your community`,
        [NotificationEventEnum.COMMUNITY_ROLE_CHANGE]: `Your role in the community has changed`,
        [NotificationEventEnum.COMMUNITY_BAN]: `You have been banned from a community`,
        [NotificationEventEnum.NEW_MESSAGE]: `${a}${others} sent you a message`,
        [NotificationEventEnum.MESSAGE_REQUEST]: `${a}${others} sent you a message request`,
        [NotificationEventEnum.MODERATION_RESULT]: `Your post has been reviewed`,
        [NotificationEventEnum.REPUTATION_MILESTONE]: `You reached a new reputation milestone`,
        [NotificationEventEnum.SYSTEM_ANNOUNCEMENT]: `New system announcement`,
    };

    return messages[event.Type] ?? `New notification from ${a}`;
}