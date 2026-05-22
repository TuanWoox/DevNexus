using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class CommunityCommentsReport : BaseCommunityReport
    {
        [Required]
        [ForeignKey(nameof(Comment))]
        public string CommentId { get; set; } = null!;
        public virtual Comment Comment { get; set; } = null!;
    }
}
