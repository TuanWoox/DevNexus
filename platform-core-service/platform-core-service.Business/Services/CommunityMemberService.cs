using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMember;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using shared_contracts.Models.DTOs.HelperDTO;

namespace platform_core_service.Business.Services
{
    public class CommunityMemberService(
        ApplicationDbContext context,
        IMapper mapper,
        IUserContext userContext,
        IRepository<CommunityMember, string> memberRepository,
        IRepository<CommunityMembershipRequest, string> requestRepository,
        IRepository<CommunityBan, string> banRepository) : ICommunityMemberService
    {
        private readonly ApplicationDbContext _context = context;
        private readonly IMapper _mapper = mapper;
        private readonly IUserContext _userContext = userContext;
        private readonly IRepository<CommunityMember, string> _memberRepository = memberRepository;
        private readonly IRepository<CommunityMembershipRequest, string> _requestRepository = requestRepository;
        private readonly IRepository<CommunityBan, string> _banRepository = banRepository;

        // Returns true if profileId is the community owner OR a moderator of the community
        private async Task<bool> IsOwnerOrModeratorAsync(string communityId, string profileId)
        {
            var community = await _context.Communities
                .FirstOrDefaultAsync(c => c.Id == communityId);

            if (community?.OwnerId == profileId) return true;

            return await _context.CommunityModerators
                .AnyAsync(m => m.CommunityId == communityId && m.ModeratorId == profileId);
        }

        public async Task<ReturnResult<object>> JoinAsync(string communityId)
        {
            var result = new ReturnResult<object>();
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

                // Step 3: Load community
                var community = await _context.Communities
                    .FirstOrDefaultAsync(c => c.Id == communityId);

                if (community == null)
                {
                    result.Message = $"Community {communityId} not found";
                    return result;
                }

                // Step 4: Owner cannot join their own community (they are the admin)
                if (community.OwnerId == profileId)
                {
                    result.Message = "You are the owner of this community";
                    return result;
                }

                // Step 5: Check if already a member
                var alreadyMember = await _context.CommunityMembers
                    .AnyAsync(m => m.CommunityId == communityId && m.ProfileId == profileId);

                if (alreadyMember)
                {
                    result.Message = "You are already a member of this community";
                    return result;
                }

                // Step 6: Check if user is banned
                var isBanned = await _context.CommunityBans
                    .AnyAsync(b => b.CommunityId == communityId && b.BannedProfileId == profileId);

                if (isBanned)
                {
                    result.Message = "You have been banned from this community";
                    return result;
                }

                // Step 7: Check if there's already a pending request
                var hasRequest = await _context.CommunityMembershipRequests
                    .AnyAsync(r => r.CommunityId == communityId && r.RequesterId == profileId);

                if (hasRequest)
                {
                    result.Message = "You already have a pending join request for this community";
                    return result;
                }

                // Step 8: Public community → add directly as member
                if (!community.IsPrivate)
                {
                    var member = new CommunityMember
                    {
                        Id = Guid.NewGuid().ToString(),
                        CommunityId = communityId,
                        ProfileId = profileId
                    };

                    _context.CommunityMembers.Add(member);
                    await _context.SaveChangesAsync();

                    var saved = await _context.CommunityMembers
                        .Include(m => m.Profile)
                        .FirstAsync(m => m.Id == member.Id);

                    result.Result = _mapper.Map<SelectCommunityMemberDTO>(saved);
                    return result;
                }

                // Step 9: Private community → create pending request
                var request = new CommunityMembershipRequest
                {
                    Id = Guid.NewGuid().ToString(),
                    CommunityId = communityId,
                    RequesterId = profileId
                };

                _context.CommunityMembershipRequests.Add(request);
                await _context.SaveChangesAsync();

                var savedRequest = await _context.CommunityMembershipRequests
                    .Include(r => r.Requester)
                    .FirstAsync(r => r.Id == request.Id);

                result.Result = _mapper.Map<SelectCommunityMembershipRequestDTO>(savedRequest);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while joining community: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<bool>> LeaveAsync(string communityId)
        {
            var result = new ReturnResult<bool>();
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

                // Step 3: Load community
                var community = await _context.Communities
                    .FirstOrDefaultAsync(c => c.Id == communityId);

                if (community == null)
                {
                    result.Message = $"Community {communityId} not found";
                    return result;
                }

                // Step 4: Owner cannot leave their community
                if (community.OwnerId == profileId)
                {
                    result.Message = "The community owner cannot leave. Transfer ownership or delete the community instead.";
                    return result;
                }

                // Step 5: Find member record
                var member = await _context.CommunityMembers
                    .FirstOrDefaultAsync(m => m.CommunityId == communityId && m.ProfileId == profileId);

                if (member == null)
                {
                    result.Message = "You are not a member of this community";
                    return result;
                }

                // Step 6: If the leaving member is a moderator, also remove their moderator record
                var moderatorEntry = await _context.CommunityModerators
                    .FirstOrDefaultAsync(m => m.CommunityId == communityId && m.ModeratorId == profileId);

                if (moderatorEntry != null)
                    _context.CommunityModerators.Remove(moderatorEntry);

                // Step 7: Hard-delete member record
                _context.CommunityMembers.Remove(member);
                await _context.SaveChangesAsync();

                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while leaving community: {ex.Message}";
                result.Result = false;
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

        public async Task<ReturnResult<PagedData<SelectCommunityMemberDTO, string>>> GetMembersAsync(string communityId, Page<string> page)
        {
            var result = new ReturnResult<PagedData<SelectCommunityMemberDTO, string>>();
            try
            {
                // Step 1: Validate input
                if (string.IsNullOrEmpty(communityId))
                {
                    result.Message = "Community ID is required";
                    return result;
                }

                // Step 2: Build query (public endpoint)
                var query = _context.CommunityMembers
                    .Include(m => m.Profile)
                    .Where(m => m.CommunityId == communityId)
                    .AsQueryable();

                result.Result = await _memberRepository.GetPagingAsync<Page<string>, SelectCommunityMemberDTO>(query, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while retrieving members: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<SelectCommunityBanDTO>> BanMemberAsync(CreateCommunityBanDTO createDTO)
        {
            var result = new ReturnResult<SelectCommunityBanDTO>();
            try
            {
                // Step 1: Validate input
                if (createDTO == null)
                {
                    result.Message = "Ban data is required";
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
                if (!await IsOwnerOrModeratorAsync(createDTO.CommunityId, profileId))
                {
                    result.Message = "Only the community owner or a moderator can ban members";
                    return result;
                }

                // Step 4: Cannot ban the community owner
                var community = await _context.Communities
                    .FirstOrDefaultAsync(c => c.Id == createDTO.CommunityId);

                if (community == null)
                {
                    result.Message = $"Community {createDTO.CommunityId} not found";
                    return result;
                }

                if (community.OwnerId == createDTO.BannedProfileId)
                {
                    result.Message = "The community owner cannot be banned";
                    return result;
                }

                // Step 5: Check if already banned
                var alreadyBanned = await _context.CommunityBans
                    .AnyAsync(b => b.CommunityId == createDTO.CommunityId && b.BannedProfileId == createDTO.BannedProfileId);

                if (alreadyBanned)
                {
                    result.Message = "This user is already banned from the community";
                    return result;
                }

                // Step 6: Remove existing member record if present
                var existingMember = await _context.CommunityMembers
                    .FirstOrDefaultAsync(m => m.CommunityId == createDTO.CommunityId && m.ProfileId == createDTO.BannedProfileId);

                if (existingMember != null)
                    _context.CommunityMembers.Remove(existingMember);

                // Step 7: Create ban record
                var ban = new CommunityBan
                {
                    Id = Guid.NewGuid().ToString(),
                    CommunityId = createDTO.CommunityId,
                    BannedProfileId = createDTO.BannedProfileId,
                    BannedById = profileId,
                    BanReason = createDTO.BanReason
                };

                _context.CommunityBans.Add(ban);
                await _context.SaveChangesAsync();

                // Step 8: Return ban with profiles
                var saved = await _context.CommunityBans
                    .Include(b => b.BannedProfile)
                    .Include(b => b.BannedBy)
                    .FirstAsync(b => b.Id == ban.Id);

                result.Result = _mapper.Map<SelectCommunityBanDTO>(saved);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while banning member: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<bool>> UnbanMemberAsync(string banId)
        {
            var result = new ReturnResult<bool>();
            try
            {
                // Step 1: Validate input
                if (string.IsNullOrEmpty(banId))
                {
                    result.Message = "Ban ID is required";
                    return result;
                }

                // Step 2: Check authentication
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                // Step 3: Load ban record
                var ban = await _context.CommunityBans
                    .FirstOrDefaultAsync(b => b.Id == banId);

                if (ban == null)
                {
                    result.Message = $"Ban record {banId} not found";
                    return result;
                }

                // Step 4: Verify caller is owner or moderator
                if (!await IsOwnerOrModeratorAsync(ban.CommunityId, profileId))
                {
                    result.Message = "Only the community owner or a moderator can unban members";
                    return result;
                }

                // Step 5: Hard-delete ban record
                _context.CommunityBans.Remove(ban);
                await _context.SaveChangesAsync();

                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while unbanning member: {ex.Message}";
                result.Result = false;
            }
            return result;
        }

        public async Task<ReturnResult<PagedData<SelectCommunityBanDTO, string>>> GetBansAsync(string communityId, Page<string> page)
        {
            var result = new ReturnResult<PagedData<SelectCommunityBanDTO, string>>();
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
                    result.Message = "Only the community owner or a moderator can view ban records";
                    return result;
                }

                // Step 4: Build query
                var query = _context.CommunityBans
                    .Include(b => b.BannedProfile)
                    .Include(b => b.BannedBy)
                    .Where(b => b.CommunityId == communityId)
                    .AsQueryable();

                result.Result = await _banRepository.GetPagingAsync<Page<string>, SelectCommunityBanDTO>(query, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while retrieving ban records: {ex.Message}";
            }
            return result;
        }
    }
}
