using Microsoft.AspNetCore.Http;
using platform_core_service.Common.Attributes;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.ProfileMedia;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IProfileMediaService
    {
        Task<string> GetById([TrimmedRequired] string Id);
        Task<ReturnResult<PagedData<DisplayProfileMediaDTO, string>>> GetPaging([TrimmedRequired] string ProfileId, Page<string> page, ProfileMediaType profileMediaType = ProfileMediaType.Avatar);
        Task<ReturnResult<SelectProfileMediaDTO>> Create(CreateProfileMediaDTO createProfileMedia);
        Task<ReturnResult<SelectProfileMediaDTO>> UpdatePrimary(UpdatePrimaryProfileMediaDTO updatePrimaryProfileMedia);
        Task<ReturnResult<bool>> Delete([TrimmedRequired] string id);
        Task<ReturnResult<int>> BulkDelete(List<string> ids);
    }
}
