using platform_core_service.Common.Attributes;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMedia;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface ICommunityMediaService
    {
        Task<string> GetById([TrimmedRequired] string Id);
        Task<ReturnResult<PagedData<SelectCommunityMediaDTO, string>>> GetPaging([TrimmedRequired] string communityId, Page<string> page);
        Task<ReturnResult<SelectCommunityMediaDTO>> Create(CreateCommunityMediaDTO createCommunityMedia);
        Task<ReturnResult<SelectCommunityMediaDTO>> UpdatePrimary(UpdatePrimaryCommunityMediaDTO updatePrimaryCommunityMedia);
        Task<ReturnResult<bool>> Delete([TrimmedRequired] string id);
        Task<ReturnResult<int>> BulkDelete(List<string> ids);
    }
}
