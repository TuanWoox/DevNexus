using System.ComponentModel.DataAnnotations;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Report
{
    public class ResolveReportDTO
    {
        [Required]
        [EnumDataType(typeof(ReportResolution), ErrorMessage = "Resolution must be a valid report resolution")]
        public ReportResolution Resolution { get; set; }

        [MaxLength(1000)]
        public string? ModeratorNote { get; set; }

        [MaxLength(1000)]
        public string? ResolutionNote { get; set; }

        [EnumDataType(typeof(ReportTargetAction), ErrorMessage = "TargetAction must be a valid report target action")]
        public ReportTargetAction? TargetAction { get; set; }

        [Range(1, 365, ErrorMessage = "SuspendDays must be between 1 and 365")]
        public int? SuspendDays { get; set; }

        [MaxLength(1000)]
        public string? TargetActionReason { get; set; }
    }
}
