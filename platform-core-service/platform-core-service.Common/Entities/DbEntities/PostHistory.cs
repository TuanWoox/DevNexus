using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using platform_core_service.Common.Entities.BaseEntity;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class PostHistory : BaseEntity<string>
    {
        [Required]
        [ForeignKey(nameof(Post))]
        public string PostId { get; set; } = null!;

        [JsonIgnore]
        public Post Post { get; set; } = null!;

        [Required]
        [Column(TypeName = "jsonb")]
        public string ContentSnapshot { get; set; } = null!;
    }
}
