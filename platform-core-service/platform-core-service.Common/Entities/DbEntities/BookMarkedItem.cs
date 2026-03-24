using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Entities.BaseEntity;

namespace platform_core_service.Common.Entities.DbEntities
{
    [Index(nameof(BookMarkId), nameof(PostId), IsUnique = true, Name = "IX_BookMarkedItem_BookMark_Post")]
    [Index(nameof(BookMarkId), nameof(QAPostId), IsUnique = true, Name = "IX_BookMarkedItem_BookMark_QAPost")]
    public class BookMarkedItem : BaseEntityHardDelete<string>
    {
        [Required]
        [ForeignKey(nameof(BookMark))]
        public string BookMarkId { get; set; } = null!;
        [JsonIgnore]
        public BookMark BookMark { get; set; } = null!;

        [ForeignKey(nameof(Post))]
        public string? PostId { get; set; }
        [JsonIgnore]
        public Post? Post { get; set; }

        [ForeignKey(nameof(QAPost))]
        public string? QAPostId { get; set; }
        [JsonIgnore]
        public QAPost? QAPost { get; set; }
    }
}