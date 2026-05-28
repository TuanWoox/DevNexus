using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Entities.Identities;
using platform_core_service.Common.Utils.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class UserRecommendationFeedback: BaseEntity<string>
    {

        [Required]
        [MaxLength(26)]
        public string UserId { get; set; } = null!;
        [ForeignKey(nameof(UserId))]
        public ApplicationUser? User { get; set; }

        [MaxLength(26)]
        public string? PostId { get; set; }

        [ForeignKey(nameof(PostId))]
        public Post? Post { get; set; }

        [MaxLength(26)]
        public string? QAPostId { get; set; }
        [ForeignKey(nameof(QAPostId))]
        public QAPost? QAPost { get; set; }

        [MaxLength(26)]
        public string? CommunityId { get; set; }
        [ForeignKey(nameof(CommunityId))]
        public Community? Community { get; set; }
        /// <summary>'not_interested', 'hide', 'report_irrelevant'</summary>
        [Required]
        [MaxLength(30)]
        public FeedBackType FeedbackType { get; set; }
    }
}
