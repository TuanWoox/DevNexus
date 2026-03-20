using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMember;
using platform_core_service.Common.Models.Paging;
using shared_contracts.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface ICommunityMemberService
    {
        // Public → adds directly as member; Private → creates pending request
        Task<ReturnResult<object>> JoinAsync(string communityId);

        // Removes member record. Owner cannot leave.
        Task<ReturnResult<bool>> LeaveAsync(string communityId);

        // Public: list active members of a community
        Task<ReturnResult<PagedData<SelectCommunityMemberDTO, string>>> GetMembersAsync(string communityId, Page<string> page);
    }
}
