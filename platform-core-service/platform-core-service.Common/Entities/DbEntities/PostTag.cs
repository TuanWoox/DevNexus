using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using platform_core_service.Common.Entities.BaseEntity;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class PostTag : BaseKey, ICreated, IModified
    {
        [ForeignKey(nameof(Post))]
        [Required]
        public string PostId { get; set; }

        [JsonIgnore]
        public Post Post { get; set; }

        [ForeignKey(nameof(Tag))]
        [Required]
        public string TagId { get; set; }

        [JsonIgnore]
        public Tag Tag { get; set; }
        public DateTimeOffset? DateModified { get; set; }
        public DateTimeOffset? DateCreated { get; set; }

    }
}