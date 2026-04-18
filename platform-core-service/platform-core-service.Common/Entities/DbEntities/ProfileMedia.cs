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
    public class ProfileMedia: BaseEntity<string>
    {
        [ForeignKey(nameof(Profile))]
        public string ProfileId { get; set; } = null!;
        [JsonIgnore]
        public Profile Profile { get; set; } = null!;
        public string StoreDestination { get; set; } = null!;
        // Default to avatar
        public ProfileMediaType ProfileMediaType { get; set; } = ProfileMediaType.Avatar;
        public string SHA256Hash { get; set; } = null!;
        public bool IsPrimary { get; set; } = true;
    }
}
