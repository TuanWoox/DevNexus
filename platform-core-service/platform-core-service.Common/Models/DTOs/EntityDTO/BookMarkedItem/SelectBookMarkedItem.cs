using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.BookMarkedItem
{
    public class SelectBookMarkedItem : IBaseKey<string>
    {
        public string Id { get; set; } = null!;
        public string BookMarkId { get; set; } = null!;
        public string? PostId { get; set; }
        public string? QAPostId { get; set; }
        public SelectPostDTO? Post { get; set; }
        public SelectPostDTO? QAPost { get; set; }
    }
}
