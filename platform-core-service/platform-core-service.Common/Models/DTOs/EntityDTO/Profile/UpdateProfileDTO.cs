using System.ComponentModel.DataAnnotations;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Profile
{
    public class UpdateProfileDTO
    {
        [Required]
        public string Id { get; set; }

        [MaxLength(200)]
        public string FullName { get; set; }

        [MaxLength(500)]
        public string Bio { get; set; }

        public List<string> TechStacks { get; set; }
        public bool? IsPrivate { get; set; }
    }
}
