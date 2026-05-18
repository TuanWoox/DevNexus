using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Utils.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.PostMedia
{
    public class SelectPostMediaDTO : BaseMediaEntity<string>
    {
        public string? PostId { get; set; }
        public ContentMediaType PostMediaType { get; set; }
    }
}
