using platform_core_service.Common.Entities.BaseEntity;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Models.DTOs.MessageBusDTO
{
    public class ProfileBlockPublishDTO: BaseEntityHardDelete<string>
    {
        [Required]
        public string OwnerId { get; set; } = null!;

        [Required]
        public string BlockedProfileId { get; set; } = null!;
    }
}
