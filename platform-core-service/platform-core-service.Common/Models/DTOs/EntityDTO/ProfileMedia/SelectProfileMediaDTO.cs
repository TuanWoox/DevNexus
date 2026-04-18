using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Utils.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.ProfileMedia
{
    public class SelectProfileMediaDTO: BaseEntity<string>
    {
        public string ProfileId { get; set; } = null!;
        // Default to avatar
        public ProfileMediaType ProfileMediaType { get; set; } = ProfileMediaType.Avatar;
        public bool IsPrimary { get; set; } = true;
    }
}
