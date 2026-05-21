using System.ComponentModel.DataAnnotations;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Report
{
    public class AssignReportDTO
    {
        [MaxLength(1000)]
        public string? Note { get; set; }
    }
}
