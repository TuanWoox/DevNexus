import { EntityTypeEnum, NotificationEventEnum } from '../types/enums';

export const getEntityTypeName = (type?: EntityTypeEnum | number | null): string => {
  if (type === undefined || type === null) return "Unknown";

  const names: Record<number, string> = {
    [EntityTypeEnum.POST]: "Post",
    [EntityTypeEnum.QUESTION]: "Question",
    [EntityTypeEnum.COMMENT]: "Comment",
    [EntityTypeEnum.ANSWER]: "Answer",
    [EntityTypeEnum.COMMUNITY]: "Community",
    [EntityTypeEnum.PROFILE]: "Profile",
    [EntityTypeEnum.MESSAGE]: "Message",
  };
  return names[type] || "Unknown";
};

export const getNotificationTypeName = (type: NotificationEventEnum): string => {
  const names: Record<number, string> = {
    // Voting
    [NotificationEventEnum.UPVOTE_POST]: "Upvotes",
    [NotificationEventEnum.DOWNVOTE_POST]: "Downvotes",
    [NotificationEventEnum.UPVOTE_ANSWER]: "Answer Upvotes",
    [NotificationEventEnum.DOWNVOTE_ANSWER]: "Answer Downvotes",
    [NotificationEventEnum.UPVOTE_COMMENT]: "Comment Upvotes",
    [NotificationEventEnum.DOWNVOTE_COMMENT]: "Comment Downvotes",
    [NotificationEventEnum.UPVOTE_QUESTION]: "Question Upvotes",
    [NotificationEventEnum.DOWNVOTE_QUESTION]: "Question Downvotes",
    
    // Q&A
    [NotificationEventEnum.NEW_ANSWER]: "Answers",
    [NotificationEventEnum.COMMENT_POST]: "Post Comments",
    [NotificationEventEnum.COMMENT_QUESTION]: "Question Comments",
    [NotificationEventEnum.COMMENT_ANSWER]: "Answer Comments",
    [NotificationEventEnum.REPLY_COMMENT]: "Comment Replies",
    [NotificationEventEnum.ANSWER_ACCEPTED]: "Answer Accepted",
    
    // Follow
    [NotificationEventEnum.FOLLOW_USER]: "Follows",
    [NotificationEventEnum.FOLLOW_REQUEST]: "Follow Requests",
    [NotificationEventEnum.FOLLOW_ACCEPTED]: "Follow Accepted",
    
    // Community
    [NotificationEventEnum.COMMUNITY_INVITE]: "Community Invites",
    [NotificationEventEnum.COMMUNITY_JOIN_REQUEST]: "Join Requests",
    [NotificationEventEnum.COMMUNITY_POST]: "Community Posts",
    [NotificationEventEnum.COMMUNITY_ROLE_CHANGE]: "Role Changes",
    [NotificationEventEnum.COMMUNITY_BAN]: "Community Bans",
    [NotificationEventEnum.COMMUNITY_REPORT_CREATED]: "Community Reports",
    [NotificationEventEnum.COMMUNITY_REPORT_RESOLVED]: "Report Resolved",
    [NotificationEventEnum.CONTENT_CREATED]: "New Community Post",
    [NotificationEventEnum.CONTENT_APPROVED]: "Post Approved",
    
    // Messaging
    [NotificationEventEnum.NEW_MESSAGE]: "Messages",
    [NotificationEventEnum.MESSAGE_REQUEST]: "Message Requests",
    
    // System
    [NotificationEventEnum.MODERATION_RESULT]: "Moderation Results",
    // Reputation-specific wording is hidden until scoring rules are implemented.
    [NotificationEventEnum.REPUTATION_MILESTONE]: "Milestones",
    [NotificationEventEnum.SYSTEM_ANNOUNCEMENT]: "System Announcements",
  };
  return names[type] || `Type ${type}`;
};
