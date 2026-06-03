using platform_core_service.Common.Models.DTOs.RecommendationDTO;

namespace platform_core_service.Common.Interfaces.Recommendations
{
    public interface IUserInterestProfileService
    {
        Task<UserInterestProfile> BuildAsync();
    }
}
