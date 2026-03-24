using platform_core_service.Common.Entities.BaseEntity;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.BookMark
{
    public class SelectBookMark : BaseEntityHardDelete<string>
    {
        public string Name { get; set; } = null!;
        public string OwnerId { get; set; } = null!;
    }
}
