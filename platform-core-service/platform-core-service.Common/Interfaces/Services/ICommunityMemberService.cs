using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMember;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface ICommunityMemberService
    {
        // Public → adds directly as member; Private → creates pending request
        Task<ReturnResult<object>> JoinAsync(string communityId);

        // Removes member record. Owner cannot leave.
        Task<ReturnResult<bool>> LeaveAsync(string communityId);

        // Lists active members only when the viewer can access the community.
        Task<ReturnResult<PagedData<SelectCommunityMemberDTO, string>>> GetMembersAsync(string communityId, Page<string> page);
    }
}
