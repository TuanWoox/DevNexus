using platform_core_service.Common.Utils.Enums;
using System.ComponentModel.DataAnnotations;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.CommunityContentReport
{
    public class ResolveReportDTO
    {
        [Required]
        public string ReportId { get; set; } = null!;

        [Required]
        public ReportResolutionAction Action { get; set; }

        [StringLength(1000)]
        public string? ResolutionNotes { get; set; }

        public DateTimeOffset? MutedUntil { get; set; }
    }
}
