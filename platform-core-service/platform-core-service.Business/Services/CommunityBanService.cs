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
    public class CommunityBanService(
        ApplicationDbContext context,
        IMapper mapper,
        IUserContext userContext,
        IRepository<CommunityBan, string> banRepository) : ICommunityBanService
    {
        private readonly ApplicationDbContext _context = context;
        private readonly IMapper _mapper = mapper;
        private readonly IUserContext _userContext = userContext;
        private readonly IRepository<CommunityBan, string> _banRepository = banRepository;

        private async Task<bool> IsOwnerOrModeratorAsync(string communityId, string profileId)
        {
            var community = await _context.Communities
                .FirstOrDefaultAsync(c => c.Id == communityId);

            if (community?.OwnerId == profileId) return true;

            return await _context.CommunityModerators
                .AnyAsync(m => m.CommunityId == communityId && m.ModeratorId == profileId);
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

                // Step 3b: Cannot self-ban
                if (createDTO.BannedProfileId == profileId)
                {
                    result.Message = "It is impossible to ban yourself.";
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
                    result.Message = "It is not possible to ban the Community Owner.";
                    return result;
                }

                var callerIsOwner = community.OwnerId == profileId;

                // Step 4b: Moderator cannot ban another Moderator; owner/admin can.
                var callerIsModerator = await _context.CommunityModerators
                    .AnyAsync(m => m.CommunityId == createDTO.CommunityId && m.ModeratorId == profileId);

                var targetIsModerator = await _context.CommunityModerators
                    .AnyAsync(m => m.CommunityId == createDTO.CommunityId && m.ModeratorId == createDTO.BannedProfileId);

                if (!callerIsOwner && callerIsModerator && targetIsModerator)
                {
                    result.Message = "A Moderator cannot ban another Moderator. Please ask the Owner.";
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

                // Step 6b: Remove moderator record if present (prevent role leak after ban)
                var existingModerator = await _context.CommunityModerators
                    .FirstOrDefaultAsync(m => m.CommunityId == createDTO.CommunityId && m.ModeratorId == createDTO.BannedProfileId);

                if (existingModerator != null)
                    _context.CommunityModerators.Remove(existingModerator);

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
