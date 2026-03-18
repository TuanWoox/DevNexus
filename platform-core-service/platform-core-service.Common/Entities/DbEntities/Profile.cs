using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Entities.Identities;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class Profile : BaseEntity<string>
    {
        [ForeignKey(nameof(ApplicationUser))]
        public string ApplicationUserId { get; set; }

        [JsonIgnore]
        public ApplicationUser ApplicationUser { get; set; }

        [Required]
        [MaxLength(200)]
        public string FullName { get; set; }

        [MaxLength(500)]
        [Url(ErrorMessage = "AvatarUrl must be a valid URL")]
        public string? AvatarUrl { get; set; }

        [MaxLength(500)]
        public string Bio { get; set; }

        [Range(0, int.MaxValue)]
        public int ReputationPoints { get; set; } = 0;

        [MaxLength(100)]
        public List<string> TechStacks { get; set; }

        public ICollection<Post> Posts { get; set; } = new List<Post>();
    }
}