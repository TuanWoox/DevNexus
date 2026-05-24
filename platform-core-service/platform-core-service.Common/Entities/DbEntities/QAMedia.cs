using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Utils.Enums;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class QAMedia : BaseMediaEntity<string>, IContentMedia
    {
        [ForeignKey(nameof(QAPost))]
        public string? QAPostId { get; set; }
        
        [JsonIgnore]
        public QAPost? QAPost { get; set; }
        
        public ContentMediaType QAMediaType { get; set; }
        public string? GetCommunityId() => QAPost?.CommunityId;
    }
}
