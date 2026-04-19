using platform_core_service.Common.Attributes;
using System.ComponentModel.DataAnnotations;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMedia
{
    public class UpdatePrimaryCommunityMediaDTO
    {
        [TrimmedRequired]
        public string Id { get; set; } = null!;
        [Required]
        public string CommunityId { get; set; } = null!;
    }
}
