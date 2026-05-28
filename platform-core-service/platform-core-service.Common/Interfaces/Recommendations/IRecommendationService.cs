using platform_core_service.Common.Models.DTOs.EntityDTO.Community;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Common.Models.DTOs.EntityDTO.QAPost;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;

namespace platform_core_service.Common.Interfaces.Recommendations
{
    public interface IRecommendationService
    {
        Task<ReturnResult<PagedData<SelectPostDTO, string>>> GetPersonalizedPostFeedAsync(string userId, Page<string> page);
        Task<ReturnResult<PagedData<SelectQAPostDTO, string>>> GetPersonalizedQAPostFeedAsync(string userId, Page<string> page);
        Task<ReturnResult<PagedData<SelectCommunityDTO, string>>> GetPersonalizedCommunityFeedAsync(string userId, Page<string> page);
    }
}
