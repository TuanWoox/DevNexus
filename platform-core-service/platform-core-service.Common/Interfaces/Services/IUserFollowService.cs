using platform_core_service.Common.Models.DTOs.EntityDTO.UserFollow;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IUserFollowService
    {
        public Task<ReturnResult<object>> CreateAsync(CreateUserFollow createUserFollow);
        public Task<ReturnResult<PagedData<SelectUserFollow, string>>> GetFollowers(Page<string> page);
        public Task<ReturnResult<PagedData<SelectUserFollow, string>>> GetFollowings(Page<string> page);
        public Task<ReturnResult<bool>> DeleteById(string followId);
        public Task<ReturnResult<int>> BulkDeleteByIds(List<string> followIds);
    }
}