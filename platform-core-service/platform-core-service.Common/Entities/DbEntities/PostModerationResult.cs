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
    public class ModerationResult : BaseEntity<string>
    {
        public ModerationTargetType TargetType { get; set; } = ModerationTargetType.Post;

        [Required]
        public string TargetId { get; set; }

        public float? TextScore { get; set; }
        public float? ImageScore { get; set; }
        public float? CombinedScore { get; set; }

        [MaxLength(20)]
        public string? Decision { get; set; }

        [MaxLength(1000)]
        public string? Reasoning { get; set; }

        public DateTimeOffset ReviewedAt { get; set; }

    }
}
