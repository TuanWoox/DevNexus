using platform_core_service.Common.Models.DTOs.EntityDTO.Post;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.QAPost
{
    public class SelectQAPostDTO : SelectPostDTO
    {
        public int AnswerCount { get; set; } = 0;
    }
}
