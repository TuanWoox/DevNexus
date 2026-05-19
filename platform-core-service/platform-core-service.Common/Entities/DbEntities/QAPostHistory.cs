using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using platform_core_service.Common.Entities.BaseEntity;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class QAPostHistory : BaseEntity<string>
    {
        [Required]
        [ForeignKey(nameof(QAPost))]
        public string QAPostId { get; set; } = null!;

        [JsonIgnore]
        public QAPost QAPost { get; set; } = null!;

        [Required]
        [Column(TypeName = "jsonb")]
        public string ContentSnapshot { get; set; } = null!;
    }
}
