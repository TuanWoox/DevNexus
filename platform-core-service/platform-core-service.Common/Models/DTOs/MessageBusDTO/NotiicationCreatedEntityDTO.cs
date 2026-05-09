using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Models.DTOs.MessageBusDTO
{
    public class NotiicationCreatedEntityDTO
    {
        public NotificationEventType EventType { get; set; }

        // Actor (who triggered the action)
        public string ActorId { get; set; }

        // Recipient (who receives the notification)
        // Can be single or multiple recipients
        public object RecipientId { get; set; } // string or List<string>

        // Entity (what was interacted with)
        public NotificationEntityType EntityType { get; set; }
        public string EntityId { get; set; }
        public string? EntityTitle { get; set; }
        public string? EntityPreview { get; set; }

        // Action URL (where to navigate on click)
        public string ActionUrl { get; set; }

        // Timestamp
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        // Optional custom message (for system notifications)
        public string? Message { get; set; }
    }

    public enum NotificationEventType
    {
        // Voting
        UPVOTE_POST,
        DOWNVOTE_POST,
        UPVOTE_ANSWER,
        DOWNVOTE_ANSWER,
        UPVOTE_COMMENT,
        DOWNVOTE_COMMENT,
        UPVOTE_QUESTION,
        DOWNVOTE_QUESTION,

        // Q&A Interactions
        NEW_ANSWER,
        COMMENT_POST,
        COMMENT_ANSWER,
        REPLY_COMMENT,
        ANSWER_ACCEPTED,

        // Follow System
        FOLLOW_USER,
        FOLLOW_REQUEST,
        FOLLOW_ACCEPTED,

        // Community
        COMMUNITY_INVITE,
        COMMUNITY_JOIN_REQUEST,
        COMMUNITY_POST,
        COMMUNITY_ROLE_CHANGE,
        COMMUNITY_BAN,

        // Messaging
        NEW_MESSAGE,
        MESSAGE_REQUEST,

        // System
        MODERATION_RESULT,
        REPUTATION_MILESTONE,
        SYSTEM_ANNOUNCEMENT
    }

    public enum NotificationEntityType
    {
        POST,
        QUESTION,
        COMMENT,
        ANSWER,
        COMMUNITY,
        PROFILE,
        MESSAGE,

    }
}
