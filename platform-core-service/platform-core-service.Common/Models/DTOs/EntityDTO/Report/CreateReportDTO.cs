using System.ComponentModel.DataAnnotations;
using platform_core_service.Common.Attributes;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Report
{
    public class CreateReportDTO
    {
        [Required]
        [EnumDataType(typeof(ReportTargetType), ErrorMessage = "TargetType must be a valid report target type")]
        public ReportTargetType TargetType { get; set; }

        [TrimmedRequired]
        public string TargetId { get; set; } = null!;

        [Required]
        [EnumDataType(typeof(ReportReason), ErrorMessage = "Reason must be a valid report reason")]
        public ReportReason Reason { get; set; }

        [MaxLength(1000)]
        public string? Description { get; set; }
    }
}
