using platform_core_service.Common.Models.Paging;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.Comment
{
    public class CommentFilterPageDTO
    {
        public CommentFilterDTO Filter { get; set; } = new CommentFilterDTO();
        public Page<string> Page { get; set; } = new Page<string>();
    }
}
