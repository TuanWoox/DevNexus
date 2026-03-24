using platform_core_service.Common.Entities.Identities;
using platform_core_service.Common.Models.DTOs.EntityDTO.Profile;
using platform_core_service.Common.Models.DTOs.EntityDTO.QAPost;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IQAPostService
    {
        Task<ReturnResult<SelectQAPostDTO>> CreateAsync(CreateQAPostDTO createDTO);
        Task<ReturnResult<SelectQAPostDTO>> GetByIdAsync(string postId);
        Task<ReturnResult<PagedData<SelectQAPostDTO, string>>> GetPageAsync(Page<string> page);
        Task<ReturnResult<SelectQAPostDTO>> UpdateAsync(UpdateQAPostDTO updateDTO);
        Task<ReturnResult<bool>> DeleteByIdAsync(string postId);
        Task<ReturnResult<int>> DeleteManyAsync(List<string> ids);
    }
}
