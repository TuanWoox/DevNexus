using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Models.DTOs.MessageBusDTO
{
    public enum ActorType
    {
        Profile = 0,
        Community = 1,
        System = 2
    }

    public class NotiicationCreatedEntityDTO
    {
        public NotificationEventType EventType { get; set; }

        // Actor (who triggered the action)
        public ActorType ActorType { get; set; } = ActorType.Profile;
        public string? ActorId { get; set; }
        public string? ActorName { get; set; }
        public string? ActorAvatarUrl { get; set; }

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
        UPVOTE_POST = 0,
        DOWNVOTE_POST = 1,
        UPVOTE_ANSWER = 2,
        DOWNVOTE_ANSWER = 3,
        UPVOTE_COMMENT = 4,
        DOWNVOTE_COMMENT = 5,
        UPVOTE_QUESTION = 6,
        DOWNVOTE_QUESTION = 7,

        // Q&A Interactions
        NEW_ANSWER = 8,
        COMMENT_POST = 9,
        COMMENT_ANSWER = 10,
        REPLY_COMMENT = 11,
        ANSWER_ACCEPTED = 12,

        // Follow System
        FOLLOW_USER = 13,
        FOLLOW_REQUEST = 14,
        FOLLOW_ACCEPTED = 15,

        // Community
        COMMUNITY_INVITE = 16,
        COMMUNITY_JOIN_REQUEST = 17,
        COMMUNITY_POST = 18,
        COMMUNITY_ROLE_CHANGE = 19,
        COMMUNITY_BAN = 20,

        // Messaging
        NEW_MESSAGE = 21,
        MESSAGE_REQUEST = 22,

        // System
        MODERATION_RESULT = 23,
        REPUTATION_MILESTONE = 24,
        SYSTEM_ANNOUNCEMENT = 25,

        // Q&A (additional)
        COMMENT_QUESTION = 26,

        // Community Reports
        COMMUNITY_REPORT_CREATED = 27,
        COMMUNITY_REPORT_RESOLVED = 28
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
