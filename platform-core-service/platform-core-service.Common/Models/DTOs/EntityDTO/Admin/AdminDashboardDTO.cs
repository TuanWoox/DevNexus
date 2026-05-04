namespace platform_core_service.Common.Models.DTOs.EntityDTO.Admin
{
    public class TagStatDTO
    {
        public string TagName { get; set; } = string.Empty;
        public int PostCount { get; set; }
    }

    public class AdminDashboardDTO
    {
        /// <summary>All posts regardless of type or moderation status.</summary>
        public int TotalPosts { get; set; }

        /// <summary>Posts waiting for AI / human review (ModerationStatus == Pending).</summary>
        public int PendingPosts { get; set; }

        /// <summary>Posts cleared by AI or admin (ModerationStatus == Approved).</summary>
        public int ApprovedPosts { get; set; }

        /// <summary>Posts blocked by AI or admin (ModerationStatus == Flagged).</summary>
        public int RejectedPosts { get; set; }

        /// <summary>Posts created since midnight UTC today.</summary>
        public int PostsToday { get; set; }

        /// <summary>ModerationQueueEntry rows still awaiting a human decision (ResolvedAt IS NULL).</summary>
        public int QueueEntries { get; set; }

        /// <summary>Total registered user profiles.</summary>
        public int TotalUsers { get; set; }

        /// <summary>Top 5 tags by post count (descending).</summary>
        public List<TagStatDTO> TopTags { get; set; } = new();

        // --- Phase 6: Expanded Metrics ---

        /// <summary>Profiles created since midnight UTC today.</summary>
        public int NewUsersToday { get; set; }

        /// <summary>Profiles created in the last 7 days (rolling window from midnight UTC).</summary>
        public int NewUsersThisWeek { get; set; }

        /// <summary>Profiles created in the last 30 days (rolling window from midnight UTC).</summary>
        public int NewUsersThisMonth { get; set; }

        /// <summary>Posts that are QAPost subtype (TPH discriminator = "QAPost").</summary>
        public int TotalQuestionPosts { get; set; }

        /// <summary>Posts that are NOT QAPost subtype (concrete Post rows only).</summary>
        public int TotalNormalPosts { get; set; }

        /// <summary>Posts (all types) created in the last 7 days (rolling window from midnight UTC).</summary>
        public int PostsThisWeek { get; set; }

        /// <summary>Posts (all types) created in the last 30 days (rolling window from midnight UTC).</summary>
        public int PostsThisMonth { get; set; }

        /// <summary>Posts with ModerationStatus == InReview (flagged for human review).</summary>
        public int InReviewPosts { get; set; }

        /// <summary>Posts with ModerationStatus == Flagged (blocked by AI or admin).</summary>
        public int FlaggedPosts { get; set; }
    }
}
