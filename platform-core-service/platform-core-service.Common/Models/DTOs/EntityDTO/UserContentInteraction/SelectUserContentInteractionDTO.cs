using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.UserContentInteraction
{
    public class SelectUserContentInteractionDTO
    {
        public string? PostId { get; set; }
        public string? QAPostId { get; set; }
        public string InteractionType { get; set; } = "view";
        public int? DwellTimeSeconds { get; set; }
        public string? Source { get; set; }
    }
}
