using platform_core_service.Common.Attributes;
using platform_core_service.Common.Utils.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.ProfileMedia
{
    public class UpdatePrimaryProfileMediaDTO
    {
        [TrimmedRequired]
        public string Id { get; set; } = null!;
        [Required]
        public ProfileMediaType ProfileMediaType { get; set; } = ProfileMediaType.Avatar;
    }
}
