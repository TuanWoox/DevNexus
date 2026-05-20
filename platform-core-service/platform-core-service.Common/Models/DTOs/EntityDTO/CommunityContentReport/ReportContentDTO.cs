using platform_core_service.Common.Attributes;
using platform_core_service.Common.Utils.Enums;
using System.ComponentModel.DataAnnotations;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.CommunityContentReport
{
    public class ReportContentDTO
    {
        [Required]
        [StringLength(100, MinimumLength = 1)]
        [TrimmedRequired]
        public string CommunityId { get; set; } = null!;

        [Required]
        [StringLength(100, MinimumLength = 1)]
        [TrimmedRequired]
        public string ContentId { get; set; } = null!;

        [Required]
        [EnumDataType(typeof(ContentType))]
        public ContentType ContentType { get; set; }

        [Required]
        [StringLength(500, MinimumLength = 5)]
        [TrimmedRequired]
        public string Reason { get; set; } = null!;
    }
}
