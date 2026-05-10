import { Notification } from "src/generated/prisma/client";

export function convertTypeToMessage(event: Notification, actor: string | undefined): string {
    const a = actor ?? 'Someone';
    const title = event.EntityTitle ? `"${event.EntityTitle}"` : 'your content';

    const messages: Record<string, string> = {
        UPVOTE_POST: `${a} upvoted your post ${title}`,
        DOWNVOTE_POST: `${a} downvoted your post ${title}`,
        UPVOTE_ANSWER: `${a} upvoted your answer`,
        DOWNVOTE_ANSWER: `${a} downvoted your answer`,
        UPVOTE_COMMENT: `${a} upvoted your comment`,
        DOWNVOTE_COMMENT: `${a} downvoted your comment`,
        NEW_ANSWER: `${a} answered your question ${title}`,
        COMMENT_POST: `${a} commented on your post ${title}`,
        COMMENT_ANSWER: `${a} commented on your answer`,
        REPLY_COMMENT: `${a} replied to your comment`,
        ANSWER_ACCEPTED: `Your answer was accepted`,
        FOLLOW_USER: `${a} started following you`,
        FOLLOW_REQUEST: `${a} sent you a follow request`,
        FOLLOW_ACCEPTED: `${a} accepted your follow request`,
        COMMUNITY_INVITE: `${a} invited you to a community`,
        COMMUNITY_JOIN_REQUEST: `${a} requested to join your community`,
        COMMUNITY_POST: `New post in your community`,
        COMMUNITY_ROLE_CHANGE: `Your role in the community has changed`,
        COMMUNITY_BAN: `You have been banned from a community`,
        NEW_MESSAGE: `${a} sent you a message`,
        MESSAGE_REQUEST: `${a} sent you a message request`,
        MODERATION_RESULT: `Your post has been reviewed`,
        REPUTATION_MILESTONE: `You reached a new reputation milestone`,
        SYSTEM_ANNOUNCEMENT: `New system announcement`,
    };

    return messages[event.Type] ?? `New notification from ${a}`;
}