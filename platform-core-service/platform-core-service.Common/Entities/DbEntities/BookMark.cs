using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using platform_core_service.Common.Entities.BaseEntity;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class BookMark : BaseEntity<string>
    {
        [Required]
        [StringLength(200, MinimumLength = 1, ErrorMessage = "Name must be between 1 and 200 characters")]
        public string Name { get; set; } = null!;

        [Required]
        [ForeignKey(nameof(Owner))]
        [JsonIgnore]
        public string OwnerId { get; set; } = null!;

        [JsonIgnore]
        public Profile Owner { get; set; }

        public ICollection<BookMarkedItem> BookMarkedStores { get; set; } = [];
    }
}