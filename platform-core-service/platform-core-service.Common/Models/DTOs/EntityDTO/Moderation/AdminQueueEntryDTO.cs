using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Moderation
{
    public class AdminQueueEntryDTO : IBaseKey<string>
    {
        public string Id { get; set; } = null!;
        public ModerationTargetType TargetType { get; set; }
        public string TargetId { get; set; } = null!;
        public string PostTitle { get; set; } = null!;
        public string PostContent { get; set; } = null!;
        public string AuthorId { get; set; } = null!;
        public SelectPostAuthorDTO Author { get; set; }
        public string EntityType { get; set; }
        public string Reason { get; set; } = null!;
        public float Tier1Score { get; set; }
        public string Tier2Reasoning { get; set; } = null!;

        public string? AssignedModeratorId { get; set; }
        public DateTimeOffset? ResolvedAt { get; set; }
        public string? Resolution { get; set; }
        public string? ModeratorNote { get; set; }

        public DateTimeOffset CreatedAt { get; set; }
    }
}
