using platform_core_service.Common.Models.DTOs.EntityDTO.Vote;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IVoteService
    {
        Task<ReturnResult<bool>> VotePostAsync(string postId, VoteRequestDTO voteRequest);
        Task<ReturnResult<bool>> VoteAnswerAsync(string answerId, VoteRequestDTO voteRequest);
        Task<ReturnResult<bool>> VoteCommentAsync(string commentId, VoteRequestDTO voteRequest);
    }
}
