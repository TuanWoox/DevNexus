using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IPostService
    {
        Task<ReturnResult<SelectPostDTO>> CreateAsync(CreatePostDTO createDTO);
        Task<ReturnResult<SelectPostDTO>> GetByIdAsync(string postId);
        Task<ReturnResult<PagedData<SelectPostDTO, string>>> GetPageAsync(Page<string> page);
        Task<ReturnResult<SelectPostDTO>> UpdateAsync(UpdatePostDTO updateDTO);
        Task<ReturnResult<bool>> DeleteByIdAsync(string postId);
        Task<ReturnResult<int>> DeleteByIdsAsync(List<string> postIds);
    }
}
