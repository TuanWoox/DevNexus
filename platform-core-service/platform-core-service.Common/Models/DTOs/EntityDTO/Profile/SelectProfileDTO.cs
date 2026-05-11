namespace platform_core_service.Common.Models.DTOs.EntityDTO.Profile
{
    public class SelectProfileDTO
    {
        public string Id { get; set; }

        public string ApplicationUserId { get; set; }

        public string FullName { get; set; }

        public string? AvatarUrl { get; set; }

        public string? BackgroundUrl { get; set; }

        public string Bio { get; set; }

        public int ReputationPoints { get; set; }

        public List<string> TechStacks { get; set; }

        public bool IsPrivate { get; set; }
    }
}
