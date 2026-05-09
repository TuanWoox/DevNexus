using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.AiUsageLog
{
    public class AiWorkerPageRequestDTO
    {
        [JsonPropertyName("page_number")]
        public int PageNumber { get; set; } = 1;
        [JsonPropertyName("size")]
        public int Size { get; set; } = 20;
        [JsonPropertyName("filters")]
        public List<AiWorkerFilterMapping> Filters { get; set; } = [];
        [JsonPropertyName("orders")]
        public List<AiWorkerOrderMapping> Orders { get; set; } = [];
    }
    public class AiWorkerFilterMapping
    {
        [JsonPropertyName("prop")]
        public string Prop { get; set; } = null!;
        [JsonPropertyName("filter_type")]
        public string FilterType { get; set; } = null!;
        [JsonPropertyName("filter_operator")]
        public string FilterOperator { get; set; } = null!;
        [JsonPropertyName("value")]
        public string? Value { get; set; }
    }
    public class AiWorkerOrderMapping
    {
        [JsonPropertyName("sort")]
        public string Sort { get; set; } = null!;
        [JsonPropertyName("sort_dir")]
        public string SortDir { get; set; } = "desc";
    }

}
