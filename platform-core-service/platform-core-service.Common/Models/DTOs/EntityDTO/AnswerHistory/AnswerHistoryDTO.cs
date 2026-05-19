using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Models.DTOs.EntityDTO.Answer;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.AnswerHistory
{
    public class AnswerHistoryDTO : IBaseKey<string>
    {
        public string Id { get; set; } = null!;
        public string AnswerId { get; set; } = null!;
        public SelectAnswerDTO? Content { get; set; }
        public DateTimeOffset? DateCreated { get; set; }
    }
}
