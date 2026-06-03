using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Entities.Identities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class UserContentInteraction: BaseEntity<string>
    {
        [Required]
        public string ProfileId { get; set; } = null!;
        // Navigation properties
        [ForeignKey(nameof(ProfileId))]
        public Profile? Profile { get; set; }

        public string? PostId { get; set; }

        [ForeignKey(nameof(PostId))]
        public Post? Post { get; set; }

        public string? QAPostId { get; set; }
        [ForeignKey(nameof(QAPostId))]
        public QAPost? QAPost { get; set; }

        /// <summary>'view', 'dwell', 'click', 'share'</summary>
        [Required]
        [MaxLength(20)]
        public string InteractionType { get; set; } = null!;

        /// <summary>Seconds spent reading (only for 'dwell' type)</summary>
        public int? DwellTimeSeconds { get; set; }

        /// <summary>'feed', 'search', 'recommendation', 'direct'</summary>
        [MaxLength(20)]
        public string? Source { get; set; }
    }
}
