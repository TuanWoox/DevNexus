using platform_core_service.Common.Entities.BaseEntity;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class ModerationQueueEntry : BaseEntity<string>
    {
        [Required]
        [ForeignKey(nameof(Post))]
        public string PostId { get; set; }

        [JsonIgnore]
        public Post Post { get; set; }

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
