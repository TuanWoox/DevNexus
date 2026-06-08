using platform_core_service.Common.Entities.BaseEntity;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class ModerationQueueEntry : BaseEntity<string>
    {
        public ModerationTargetType TargetType { get; set; } = ModerationTargetType.Post;

        [Required]
        public string TargetId { get; set; }

        [MaxLength(255)]
        public string Reason { get; set; }

        public float Tier1Score { get; set; }

        [MaxLength(1000)]
        public string Tier2Reasoning { get; set; }

        public string? AssignedModeratorId { get; set; }
        public DateTimeOffset? ResolvedAt { get; set; }

        [MaxLength(50)]
        public string? Resolution { get; set; }

        [MaxLength(500)]
        public string? ModeratorNote { get; set; }
    }
}
