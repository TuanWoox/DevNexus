using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.AiUsageLog
{
    public class AiUsageLogPageResponseDTO
    {
        public List<AiUsageLogDTO> Data { get; set; } = [];
        public int Total { get; set; }
        public int Page { get; set; }
        [JsonPropertyName("page_size")]
        public int PageSize { get; set; }
    }
}
