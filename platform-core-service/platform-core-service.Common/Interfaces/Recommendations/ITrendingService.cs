using platform_core_service.Common.Models.DTOs.EntityDTO.Community;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Recommendations
{
    public interface ITrendingService
    {
        Task<Dictionary<string, double>> GetPostTrendingScoresAsync(IEnumerable<string> postIds);
        Task<Dictionary<string, double>> GetQAPostTrendingScoresAsync(IEnumerable<string> qaPostIds);
        Task<ReturnResult<List<SelectPostDTO>>> GetTrendingPostsAsync(string period, int limit);
        Task<ReturnResult<List<SelectCommunityDTO>>> GetTrendingCommunitiesAsync(string period, int limit);
    }
}
