using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Utils.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class PostMedia: BaseMediaEntity<string>
    {
        [ForeignKey(nameof(Post))]
        public string? PostId { get; set; }
        [JsonIgnore]
        public Post? Post { get; set; }
        public PostMediaType PostMediaType { get; set; }
    }
}
