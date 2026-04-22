using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Utils.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.QAMedia
{
    public class SelectQAMediaDTO : BaseMediaEntity<string>
    {
        public string? QAPostId { get; set; }
        public PostMediaType QAMediaType { get; set; }
    }
}
