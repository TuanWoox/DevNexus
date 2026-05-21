using System.ComponentModel.DataAnnotations;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Report
{
    public class EscalateReportDTO
    {
        [MaxLength(1000)]
        public string? ModeratorNote { get; set; }

        [MaxLength(1000)]
        public string? EscalationReason { get; set; }
    }
}
