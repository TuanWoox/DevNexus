namespace platform_core_service.Common.Models.DTOs.EntityDTO.CommunityModerator
{
    public class ModeratorProfileDTO
    {
        public string Id { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string? AvatarUrl { get; set; }
        public string? Bio { get; set; }
        public int ReputationPoints { get; set; }
    }
}
