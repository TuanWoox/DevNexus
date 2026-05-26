using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Models.DTOs.EntityDTO.Community;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.ProfileCommunityBlock
{
    public class SelectProfileCommunityBlock : IBaseKey<string>
    {
        public string Id { get; set; } = null!;
        public string ProfileId { get; set; } = null!;
        public string CommunityId { get; set; } = null!;
        public DateTimeOffset? DateCreated { get; set; }
        public SelectCommunityDTO Community { get; set; } = null!;
    }
}
