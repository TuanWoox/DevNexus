using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Helper;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMember;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Business.Services
{
    public class CommunityMembershipRequestService(
        ApplicationDbContext context,
        IMapper mapper,
        IUserContext userContext,
        IRepository<CommunityMembershipRequest, string> requestRepository) : ICommunityMembershipRequestService
    {
        private readonly ApplicationDbContext _context = context;
        private readonly IMapper _mapper = mapper;
        private readonly IUserContext _userContext = userContext;
        private readonly IRepository<CommunityMembershipRequest, string> _requestRepository = requestRepository;

        private async Task<bool> IsOwnerOrModeratorAsync(string communityId, string profileId)
        {
            var community = await _context.Communities
                .FirstOrDefaultAsync(c => c.Id == communityId);

            if (community?.OwnerId == profileId) return true;

            return await _context.CommunityModerators
                .AnyAsync(m => m.CommunityId == communityId && m.ModeratorId == profileId);
        }

        public async Task<ReturnResult<bool>> CancelRequest(string communityId)
        {
            var result = new ReturnResult<bool>();
            try
            {
                if (string.IsNullOrEmpty(communityId))
                {
                    result.Message = "Community ID is required";
                    return result;
                }

                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                var request = await _context.CommunityMembershipRequests
                    .Where(x => x.CommunityId == communityId && x.RequesterId == profileId)
                    .FirstOrDefaultAsync();

                if (request != null)
                {
                    _context.CommunityMembershipRequests.Remove(request);
                    if (await _context.SaveChangesAsync() > 0)
                    {
                        result.Result = true;
                    }
                    else result.Message = "Cancel request can't be done at the moment, please try again";
                }
                else result.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_FOUND, "Request To Join Community", communityId);
                return result;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while cancelling request: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<SelectCommunityMemberDTO>> ApproveRequestAsync(string requestId)
        {
            var result = new ReturnResult<SelectCommunityMemberDTO>();
            try
            {
                // Step 1: Validate input
                if (string.IsNullOrEmpty(requestId))
                {
                    result.Message = "Request ID is required";
                    return result;
                }

                // Step 2: Check authentication
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                // Step 3: Load request
                var request = await _context.CommunityMembershipRequests
                    .FirstOrDefaultAsync(r => r.Id == requestId);

                if (request == null)
                {
                    result.Message = $"Membership request {requestId} not found";
                    return result;
                }

                // Step 4: Verify caller is owner or moderator
                if (!await IsOwnerOrModeratorAsync(request.CommunityId, profileId))
                {
                    result.Message = "Only the community owner or a moderator can approve membership requests";
                    return result;
                }

                // Step 5: Create member record
                var member = new CommunityMember
                {
                    Id = Guid.NewGuid().ToString(),
                    CommunityId = request.CommunityId,
                    ProfileId = request.RequesterId
                };

                _context.CommunityMembers.Add(member);

                // Step 6: Hard-delete the request
                _context.CommunityMembershipRequests.Remove(request);

                await _context.SaveChangesAsync();

                // Step 7: Return member with profile
                var saved = await _context.CommunityMembers
                    .Include(m => m.Profile)
                    .FirstAsync(m => m.Id == member.Id);

                result.Result = _mapper.Map<SelectCommunityMemberDTO>(saved);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while approving request: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<bool>> RejectRequestAsync(string requestId)
        {
            var result = new ReturnResult<bool>();
            try
            {
                // Step 1: Validate input
                if (string.IsNullOrEmpty(requestId))
                {
                    result.Message = "Request ID is required";
                    return result;
                }

                // Step 2: Check authentication
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                // Step 3: Load request
                var request = await _context.CommunityMembershipRequests
                    .FirstOrDefaultAsync(r => r.Id == requestId);

                if (request == null)
                {
                    result.Message = $"Membership request {requestId} not found";
                    return result;
                }

                // Step 4: Verify caller is owner or moderator
                if (!await IsOwnerOrModeratorAsync(request.CommunityId, profileId))
                {
                    result.Message = "Only the community owner or a moderator can reject membership requests";
                    return result;
                }

                // Step 5: Hard-delete the request
                _context.CommunityMembershipRequests.Remove(request);
                await _context.SaveChangesAsync();

                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while rejecting request: {ex.Message}";
                result.Result = false;
            }
            return result;
        }

        public async Task<ReturnResult<PagedData<SelectCommunityMembershipRequestDTO, string>>> GetPendingRequestsAsync(string communityId, Page<string> page)
        {
            var result = new ReturnResult<PagedData<SelectCommunityMembershipRequestDTO, string>>();
            try
            {
                // Step 1: Validate input
                if (string.IsNullOrEmpty(communityId))
                {
                    result.Message = "Community ID is required";
                    return result;
                }

                // Step 2: Check authentication
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                // Step 3: Verify caller is owner or moderator
                if (!await IsOwnerOrModeratorAsync(communityId, profileId))
                {
                    result.Message = "Only the community owner or a moderator can view pending requests";
                    return result;
                }

                // Step 4: Build query
                var query = _context.CommunityMembershipRequests
                    .Include(r => r.Requester)
                    .Where(r => r.CommunityId == communityId)
                    .AsQueryable();

                result.Result = await _requestRepository.GetPagingAsync<Page<string>, SelectCommunityMembershipRequestDTO>(query, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while retrieving pending requests: {ex.Message}";
            }
            return result;
        }
    }
}
