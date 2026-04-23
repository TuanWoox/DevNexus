using platform_core_service.Common.Entities.BaseEntity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Models.DTOs.MessageBusDTO
{
    public class ProfilePublishDTO: BaseEntity<string>
    {
        public string ApplicationUserId { get; set; }

        public string FullName { get; set; }

        public string? AvatarUrl { get; set; }

        public string? BackgroundUrl { get; set; }

        public string Bio { get; set; }

        public int ReputationPoints { get; set; }

        public List<string> TechStacks { get; set; }

        public bool IsPrivate { get; set; }
    }
}
