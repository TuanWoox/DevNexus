using platform_core_service.Common.Entities.BaseEntity;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMedia
{
    public class SelectCommunityMediaDTO : BaseEntity<string>
    {
        public string CommunityId { get; set; } = null!;
        public bool IsPrimary { get; set; } = true;
    }
}
