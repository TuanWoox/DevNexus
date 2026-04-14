using platform_core_service.Common.Models.DTOs.EntityDTO.Answer;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IAnswerService
    {
        Task<ReturnResult<SelectAnswerDTO>> CreateAsync(CreateAnswerDTO answerDTO);
        Task<ReturnResult<SelectAnswerDTO>> GetAnswerByIdAsync(string answerId);
        Task<ReturnResult<PagedData<SelectAnswerDTO, string>>> GetAnswersByPostIdAsync(string postId, Page<string> page);
        Task<ReturnResult<SelectAnswerDTO>> UpdateAsync(UpdateAnswerDTO answerDTO);
        Task<ReturnResult<bool>> DeleteByIdAsync(string answerId);
        Task<ReturnResult<bool>> AcceptAnswerAsync(string answerId);
    }
}
