using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using platform_core_service.Common.Entities.BaseEntity;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class CommentHistory : BaseEntity<string>
    {
        [Required]
        [ForeignKey(nameof(Comment))]
        public string CommentId { get; set; } = null!;

        [JsonIgnore]
        public Comment Comment { get; set; } = null!;

        [Required]
        [Column(TypeName = "jsonb")]
        public string ContentSnapshot { get; set; } = null!;
    }
}
