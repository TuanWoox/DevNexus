using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Models.DTOs.MessageBusDTO
{
    public class AIFirstResponseResultDTO
    {
        public string PostId { get; set; } = null!;
        public bool Success { get; set; }
        public string? GeneratedComment { get; set; }
        public string? ErrorMessage { get; set; }
    }
}
