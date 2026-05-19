using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.PostHistory
{
    public class PostHistoryDTO : IBaseKey<string>
    {
        public string Id { get; set; } = null!;
        public string PostId { get; set; } = null!;
        public SelectPostDTO? Content { get; set; }
        public DateTimeOffset? DateCreated { get; set; }
    }
}
