using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class CommunityPostsReport : BaseCommunityReport
    {
        [Required]
        [ForeignKey(nameof(Post))]
        public string PostId { get; set; } = null!;
        public virtual Post Post { get; set; } = null!;
    }
}
