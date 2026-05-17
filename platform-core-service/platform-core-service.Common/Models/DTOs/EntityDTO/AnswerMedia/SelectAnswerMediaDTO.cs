using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.AnswerMedia
{
    public class SelectAnswerMediaDTO : BaseMediaEntity<string>
    {
        public string? AnswerId { get; set; }
        public PostMediaType AnswerMediaType { get; set; }
    }
}
