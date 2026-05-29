using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.BookMark
{
    public class SelectBookMark : BaseEntityHardDelete<string>
    {
        public string Name { get; set; } = null!;
        public string OwnerId { get; set; } = null!;
        public string? PreviewImageMediaId { get; set; }
        public ContentType? PreviewImageContentType { get; set; }
    }
}
