using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Models.DTOs.EntityDTO.QAPost;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.QAPostHistory
{
    public class QAPostHistoryDTO : IBaseKey<string>
    {
        public string Id { get; set; } = null!;
        public string QAPostId { get; set; } = null!;
        public SelectQAPostDTO? Content { get; set; }
        public DateTimeOffset? DateCreated { get; set; }
    }
}
