using System.ComponentModel.DataAnnotations;
using platform_core_service.Common.Entities.BaseEntity;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class Tag : BaseEntity<string>
    {
        [Required]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Tag name must be between 2 and 100 characters")]
        public string Name { get; set; }
        public ICollection<PostTag> PostTags { get; set; } = new List<PostTag>();
    }
}