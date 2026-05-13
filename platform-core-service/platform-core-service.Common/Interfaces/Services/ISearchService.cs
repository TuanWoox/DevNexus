using platform_core_service.Common.Models.DTOs.EntityDTO.Search;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface ISearchService
    {
        Task<ReturnResult<GlobalSearchResultDTO>> SearchAllAsync(Page<string> page, CancellationToken cancellationToken = default);
        Task<PagedData<SearchPostResultDTO, string>> SearchPostsAsync(Page<string> page, CancellationToken cancellationToken = default);
        Task<PagedData<SearchQAPostResultDTO, string>> SearchQAPostsAsync(Page<string> page, CancellationToken cancellationToken = default);
        Task<PagedData<SearchCommunityResultDTO, string>> SearchCommunitiesAsync(Page<string> page, CancellationToken cancellationToken = default);
        Task<PagedData<SearchProfileResultDTO, string>> SearchProfilesAsync(Page<string> page, CancellationToken cancellationToken = default);
    }
}
