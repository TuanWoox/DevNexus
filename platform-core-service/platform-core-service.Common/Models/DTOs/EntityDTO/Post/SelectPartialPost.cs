using platform_core_service.Common.Entities.BaseEntity;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Post
{
    public class SelectPartialPost : IBaseKey<string>
    {
        public string Id { get; set; } = null!;

        public string Title { get; set; } = null!;

        public string Slug { get; set; } = null!;
    }
}