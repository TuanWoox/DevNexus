using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class CommunityQAPostReports : BaseCommunityReport
    {
        [Required]
        [ForeignKey(nameof(QAPost))]
        public string QAPostId { get; set; } = null!;
        public virtual QAPost QAPost { get; set; } = null!;
    }
}
