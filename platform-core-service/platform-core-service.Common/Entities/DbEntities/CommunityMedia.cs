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
    public class CommunityMedia: BasePrimaryMediaEntity<string>
    {
        [ForeignKey(nameof(Community))]
        public string CommunityId { get; set; } = null!;
        [JsonIgnore]
        public Community Community { get; set; } = null!;
    }
}
