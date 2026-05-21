namespace platform_core_service.Common.Models.DTOs.EntityDTO.Report
{
    public class ProfileSummaryDTO
    {
        public string Id { get; set; } = null!;
        public string? ApplicationUserId { get; set; }
        public string DisplayName { get; set; } = null!;
        public string? AvatarUrl { get; set; }
        public string? Role { get; set; }
        public bool IsSuspended { get; set; }
        public bool Deleted { get; set; }
    }
}
