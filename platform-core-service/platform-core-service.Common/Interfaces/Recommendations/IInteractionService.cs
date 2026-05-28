using platform_core_service.Common.Models.DTOs.EntityDTO.UserContentInteraction;
using platform_core_service.Common.Models.DTOs.EntityDTO.UserRecommendationFeedback;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Recommendations
{
    public interface IInteractionService
    {
        Task<ReturnResult<bool>> TrackAsync(string userId, SelectUserContentInteractionDTO dto);
        Task<ReturnResult<bool>> SubmitFeedbackAsync(string userId, CreateUserRecommendationFeedbackDTO dto);
    }
}
