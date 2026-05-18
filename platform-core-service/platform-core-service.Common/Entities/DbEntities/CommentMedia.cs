using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Utils.Enums;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class CommentMedia : BaseMediaEntity<string>, IContentMedia
    {
        [ForeignKey(nameof(Comment))]
        public string? CommentId { get; set; }

        [JsonIgnore]
        public Comment? Comment { get; set; }

        public ContentMediaType CommentMediaType { get; set; }

        public string GetAuthorId() => Comment?.AuthorId ?? "";
        public string? GetCommunityId() => Comment?.Post?.CommunityId ?? Comment?.Answer?.QAPost?.CommunityId;
    }
}
