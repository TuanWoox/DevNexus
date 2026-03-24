using platform_core_service.Common.Models.DTOs.EntityDTO.Comment;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface ICommentService
    {
        Task<ReturnResult<SelectCommentDTO>> CreateAsync(CreateCommentDTO createDTO);
        Task<ReturnResult<SelectCommentDTO>> GetByIdAsync(string commentId);
        Task<ReturnResult<PagedData<SelectCommentDTO, string>>> GetMyCommentsAsync(CommentFilterDTO filter, Page<string> page);
        Task<ReturnResult<PagedData<SelectCommentDTO, string>>> GetRepliesAsync(string commentId, Page<string> page);
        Task<ReturnResult<SelectCommentDTO>> UpdateAsync(UpdateCommentDTO updateDTO);
        Task<ReturnResult<bool>> DeleteByIdAsync(string commentId);
        Task<ReturnResult<PagedData<SelectCommentDTO, string>>> GetCommentsByPostAsync(string postId, Page<string> page);
        Task<ReturnResult<PagedData<SelectCommentDTO, string>>> GetCommentsByAnswerAsync(string answerId, Page<string> page);
    }
}
