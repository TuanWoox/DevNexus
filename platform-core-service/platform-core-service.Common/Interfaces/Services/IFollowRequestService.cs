using platform_core_service.Common.Models.DTOs.EntityDTO.FollowRequest;
using platform_core_service.Common.Models.DTOs.EntityDTO.UserFollow;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface IFollowRequestService
    {
        public Task<ReturnResult<SelectUserFollow>> ApproveFollowRequest(string requestId);
        public Task<ReturnResult<bool>> RejectFollowRequest(string requestId);
        public Task<ReturnResult<bool>> CancelFollowRequest(string requestId);
        public Task<ReturnResult<PagedData<SelectFollowRequest, string>>> GetReceivedRequestFollow(Page<string> page);
        public Task<ReturnResult<PagedData<SelectFollowRequest, string>>> GetSentRequestFollow(Page<string> page);
        public Task<ReturnResult<int>> BulkApproveFollowRequests(List<string> requestIds);
        public Task<ReturnResult<int>> BulkRejectFollowRequests(List<string> requestIds);
        public Task<ReturnResult<int>> BulkCancelFollowRequests(List<string> requestIds);
    }
}