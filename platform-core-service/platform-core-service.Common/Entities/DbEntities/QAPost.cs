
using System.Collections.Generic;
using System.Text.Json.Serialization;
using platform_core_service.Common.Entities.DbEntities;

namespace platform_core_service.Common.Entities.DbEntities
{
    public class QAPost : Post
    {
        public ICollection<Answer> Answers { get; set; } = new List<Answer>();
        [JsonIgnore]
        public List<QAMedia> QAMedias { get; set; } = [];
    }
}