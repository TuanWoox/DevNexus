using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMember;
using platform_core_service.Common.Models.DTOs.EntityDTO.Profile;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using shared_contracts.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Interfaces.Services
{
    public interface ICommunityMemberService
    {
        // Public → adds directly as member; Private → creates pending request
        Task<ReturnResult<object>> JoinAsync(string communityId);

        // Removes member record. Owner cannot leave.
        Task<ReturnResult<bool>> LeaveAsync(string communityId);

        // Owner OR Moderator: approve pending request → hard-delete request, create member
        Task<ReturnResult<SelectCommunityMemberDTO>> ApproveRequestAsync(string requestId);

        // Owner OR Moderator: reject pending request → hard-delete request
        Task<ReturnResult<bool>> RejectRequestAsync(string requestId);

        // Owner OR Moderator: view pending requests for a community
        Task<ReturnResult<PagedData<SelectCommunityMembershipRequestDTO, string>>> GetPendingRequestsAsync(string communityId, Page<string> page);

        // Public: list active members of a community
        Task<ReturnResult<PagedData<SelectCommunityMemberDTO, string>>> GetMembersAsync(string communityId, Page<string> page);

        // Owner OR Moderator: ban a member (removes member, creates ban record)
        Task<ReturnResult<SelectCommunityBanDTO>> BanMemberAsync(CreateCommunityBanDTO createDTO);

        // Owner OR Moderator: unban (hard-deletes ban record)
        Task<ReturnResult<bool>> UnbanMemberAsync(string banId);

        // Owner OR Moderator: list ban records
        Task<ReturnResult<PagedData<SelectCommunityBanDTO, string>>> GetBansAsync(string communityId, Page<string> page);
    }
}
