using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMember;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface ICommunityMembershipRequestService
    {
        Task<ReturnResult<bool>> CancelRequest(string communityId);
        Task<ReturnResult<SelectCommunityMemberDTO>> ApproveRequestAsync(string requestId);
        Task<ReturnResult<bool>> RejectRequestAsync(string requestId);
        Task<ReturnResult<PagedData<SelectCommunityMembershipRequestDTO, string>>> GetPendingRequestsAsync(string communityId, Page<string> page);
        Task<ReturnResult<int>> BulkApproveRequestByIds(string communityId,List<string> ids);
        Task<ReturnResult<int>> BulkApproveRejectByIds(string communityId,List<string> ids);
    }
}
