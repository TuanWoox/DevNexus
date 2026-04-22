using Microsoft.AspNetCore.Http;
using platform_core_service.Common.Utils.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.ProfileMedia
{
    public class CreateProfileMediaDTO
    {
        [Required]
        public IFormFile File { get; set; } = null!;
        [Required]
        public ProfileMediaType ProfileMediaType { get; set; } = ProfileMediaType.Avatar;
    }
}
