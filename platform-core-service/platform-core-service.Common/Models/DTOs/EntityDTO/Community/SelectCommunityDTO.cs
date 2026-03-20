using platform_core_service.Common.Entities.BaseEntity;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Community
{
    public class SelectCommunityDTO : IBaseKey<string>
    {
        public string Id { get; set; } = null!;
        public string OwnerId { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string? CommunityCoverPhotoUrl { get; set; }
        public string Slug { get; set; } = null!;
        public bool IsPrivate { get; set; }
        public DateTimeOffset? DateCreated { get; set; }
        public DateTimeOffset? DateModified { get; set; }
    }
}
