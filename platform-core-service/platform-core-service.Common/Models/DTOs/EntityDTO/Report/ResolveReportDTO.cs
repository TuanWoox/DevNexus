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
    }
}
