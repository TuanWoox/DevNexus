using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Moderation
{
    public class ModerationMediaManifestItemDTO
    {
        public string Id { get; set; } = null!;
        public ContentType ContentType { get; set; }
        public ContentMediaType MediaType { get; set; }
        public string StoreDestination { get; set; } = null!;
        public string Sha256Hash { get; set; } = null!;
    }
}
