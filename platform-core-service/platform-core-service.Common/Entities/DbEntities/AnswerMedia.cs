using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Utils.Enums;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class AnswerMedia : BaseMediaEntity<string>, IContentMedia
    {
        [ForeignKey(nameof(Answer))]
        public string? AnswerId { get; set; }

        [JsonIgnore]
        public Answer? Answer { get; set; }

        public ContentMediaType AnswerMediaType { get; set; }

        public string GetAuthorId() => Answer?.AuthorId ?? "";
        public string? GetCommunityId() => Answer?.QAPost?.CommunityId;
    }
}
