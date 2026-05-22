using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class CommunityAnswersReport : BaseCommunityReport
    {
        [Required]
        [ForeignKey(nameof(Answer))]
        public string AnswerId { get; set; } = null!;
        public virtual Answer Answer { get; set; } = null!;
    }
}
