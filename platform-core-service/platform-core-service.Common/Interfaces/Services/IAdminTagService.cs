using platform_core_service.Common.Models.DTOs.EntityDTO.Tag;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IAdminTagService
    {
        Task<ReturnResult<PagedData<SelectTagDTO, string>>> GetPagingAsync(Page<string> page);
        Task<ReturnResult<SelectTagDTO>> CreateAsync(CreateTagDTO dto);
        Task<ReturnResult<bool>> UpdateAsync(UpdateTagDTO dto);
        Task<ReturnResult<bool>> DeleteAsync(string tagId);
        Task<ReturnResult<bool>> MergeAsync(MergeTagsDTO dto);
    }
}
