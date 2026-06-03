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
        public string ProfileId { get; set; } = null!;
        [ForeignKey(nameof(ProfileId))]
        public Profile? Profile { get; set; }

        public string? PostId { get; set; }

        [ForeignKey(nameof(PostId))]
        public Post? Post { get; set; }

        public string? QAPostId { get; set; }
        [ForeignKey(nameof(QAPostId))]
        public QAPost? QAPost { get; set; }

        public string? CommunityId { get; set; }
        [ForeignKey(nameof(CommunityId))]
        public Community? Community { get; set; }
        /// <summary>'not_interested', 'hide', 'report_irrelevant'</summary>
        [Required]
        [MaxLength(30)]
        public FeedBackType FeedbackType { get; set; }
    }
}
