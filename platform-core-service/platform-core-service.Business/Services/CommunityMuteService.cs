using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Helper;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Helper;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMute;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Business.Helper;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace platform_core_service.Business.Services
{
    public class CommunityMuteService(
        ApplicationDbContext context,
        IMapper mapper,
        IUserContext userContext,
        ISocialGuardService socialGuardService,
        IRepository<CommunityMuteMember, string> muteRepository) : ICommunityMuteService
    {
        private readonly ApplicationDbContext _context = context;
        private readonly IMapper _mapper = mapper;
        private readonly IUserContext _userContext = userContext;
        private readonly ISocialGuardService _socialGuardService = socialGuardService;
        private readonly IRepository<CommunityMuteMember, string> _muteRepository = muteRepository;

        private async Task<bool> IsOwnerOrModeratorAsync(string communityId, string profileId)
        {
            var community = await _context.Communities
                .FirstOrDefaultAsync(c => c.Id == communityId);

            if (community?.OwnerId == profileId) return true;

            return await _context.CommunityModerators
                .AnyAsync(m => m.CommunityId == communityId && m.ModeratorId == profileId);
        }

        public async Task<ReturnResult<MuteStatusDTO>> GetMuteStatusAsync(string communityId)
        {
            var result = new ReturnResult<MuteStatusDTO>
            {
                Result = new MuteStatusDTO()
            };

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

                var activeMute = await _context.CommunityMutedMembers
                    .AsNoTracking()
                    .Where(m => m.CommunityId == communityId
                        && m.MutedProfileId == profileId
                        && (m.MutedUntil == null || m.MutedUntil > DateTimeOffset.UtcNow))
                    .OrderByDescending(m => m.DateCreated)
                    .FirstOrDefaultAsync();

                if (activeMute == null)
                {
                    result.Result = new MuteStatusDTO
                    {
                        IsMuted = false
                    };
                    return result;
                }

                result.Result = new MuteStatusDTO
                {
                    IsMuted = true,
                    MuteId = activeMute.Id,
                    MutedUntil = activeMute.MutedUntil,
                    MuteReason = activeMute.MuteReason
                };
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = "Failed to fetch mute status";
            }

            return result;
        }

        public async Task<ReturnResult<MuteStatusDTO>> GetProfileMuteStatusAsync(string communityId, string targetProfileId)
        {
            var result = new ReturnResult<MuteStatusDTO>
            {
                Result = new MuteStatusDTO()
            };

            try
            {
                if (string.IsNullOrEmpty(communityId))
                {
                    result.Message = "Community ID is required";
                    return result;
                }

                if (string.IsNullOrEmpty(targetProfileId))
                {
                    result.Message = "Target profile ID is required";
                    return result;
                }

                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                var communityAccess = await _socialGuardService.CheckBelongToCommunity(communityId);
                if (!communityAccess.Result)
                {
                    result.Message = communityAccess.Message;
                    return result;
                }

                var activeMute = await _context.CommunityMutedMembers
                    .AsNoTracking()
                    .Where(m => m.CommunityId == communityId
                        && m.MutedProfileId == targetProfileId
                        && (m.MutedUntil == null || m.MutedUntil > DateTimeOffset.UtcNow))
                    .OrderByDescending(m => m.DateCreated)
                    .FirstOrDefaultAsync();

                if (activeMute == null)
                {
                    result.Result = new MuteStatusDTO
                    {
                        IsMuted = false
                    };
                    return result;
                }

                result.Result = new MuteStatusDTO
                {
                    IsMuted = true,
                    MuteId = activeMute.Id,
                    MutedUntil = activeMute.MutedUntil,
                    MuteReason = activeMute.MuteReason
                };
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = "Failed to fetch profile mute status";
            }

            return result;
        }

        public async Task<ReturnResult<SelectCommunityMuteDTO>> MuteMemberAsync(CreateCommunityMuteDTO createDTO)
        {
            var result = new ReturnResult<SelectCommunityMuteDTO>();
            try
            {
                // Step 1: Validate input
                if (createDTO == null)
                {
                    result.Message = "Mute data is required";
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
                    result.Message = "Only the community owner or a moderator can mute members";
                    return result;
                }

                // Step 3b: Cannot self-mute
                if (createDTO.MutedProfileId == profileId)
                {
                    result.Message = "It is impossible to mute yourself.";
                    return result;
                }

                // Step 4: Cannot mute the community owner
                var community = await _context.Communities
                    .FirstOrDefaultAsync(c => c.Id == createDTO.CommunityId);

                if (community == null)
                {
                    result.Message = $"Community {createDTO.CommunityId} not found";
                    return result;
                }

                if (community.OwnerId == createDTO.MutedProfileId)
                {
                    result.Message = "It is not possible to mute the Community Owner.";
                    return result;
                }

                var callerIsOwner = community.OwnerId == profileId;

                // Step 4b: Moderator cannot mute another Moderator; owner/admin can.
                var callerIsModerator = await _context.CommunityModerators
                    .AnyAsync(m => m.CommunityId == createDTO.CommunityId && m.ModeratorId == profileId);

                var targetIsModerator = await _context.CommunityModerators
                    .AnyAsync(m => m.CommunityId == createDTO.CommunityId && m.ModeratorId == createDTO.MutedProfileId);

                if (!callerIsOwner && callerIsModerator && targetIsModerator)
                {
                    result.Message = "A Moderator cannot mute another Moderator. Please ask the Owner.";
                    return result;
                }

                // Step 5: Check if already actively muted (future or permanent)
                var alreadyMuted = await _context.CommunityMutedMembers
                    .AnyAsync(m => m.CommunityId == createDTO.CommunityId 
                        && m.MutedProfileId == createDTO.MutedProfileId
                        && (m.MutedUntil == null || m.MutedUntil > DateTimeOffset.UtcNow));

                if (alreadyMuted)
                {
                    result.Message = "This user is already muted in the community";
                    return result;
                }

                // Step 6: Create mute record
                var mute = new CommunityMuteMember
                {
                    Id = Guid.NewGuid().ToString(),
                    CommunityId = createDTO.CommunityId,
                    MutedProfileId = createDTO.MutedProfileId,
                    MutedById = profileId,
                    MuteReason = createDTO.MuteReason,
                    MutedUntil = createDTO.MutedUntil
                };

                _context.CommunityMutedMembers.Add(mute);
                await _context.SaveChangesAsync();

                // Step 7: Return mapped response with profile inclusions
                var saved = await _context.CommunityMutedMembers
                    .Include(m => m.MutedProfile)
                    .Include(m => m.MutedBy)
                    .FirstAsync(m => m.Id == mute.Id);

                result.Result = _mapper.Map<SelectCommunityMuteDTO>(saved);
                await ApplyMuteManagementPrivacyAsync(profileId, [result.Result]);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while muting member: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<bool>> UnmuteMemberAsync(string muteId)
        {
            var result = new ReturnResult<bool>();
            try
            {
                if (string.IsNullOrEmpty(muteId))
                {
                    result.Message = "Mute ID is required";
                    return result;
                }

                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                var mute = await _context.CommunityMutedMembers
                    .FirstOrDefaultAsync(m => m.Id == muteId);

                if (mute == null)
                {
                    result.Message = $"Mute record {muteId} not found";
                    return result;
                }

                if (!await IsOwnerOrModeratorAsync(mute.CommunityId, profileId))
                {
                    result.Message = "Only the community owner or a moderator can unmute members";
                    return result;
                }

                // Remove the mute record
                _context.CommunityMutedMembers.Remove(mute);
                await _context.SaveChangesAsync();

                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while unmuting member: {ex.Message}";
                result.Result = false;
            }
            return result;
        }

        public async Task<ReturnResult<bool>> UnmuteProfileAsync(string communityId, string targetProfileId)
        {
            var result = new ReturnResult<bool>();
            try
            {
                if (string.IsNullOrEmpty(communityId))
                {
                    result.Message = "Community ID is required";
                    return result;
                }

                if (string.IsNullOrEmpty(targetProfileId))
                {
                    result.Message = "Target profile ID is required";
                    return result;
                }

                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                if (!await IsOwnerOrModeratorAsync(communityId, profileId))
                {
                    result.Message = "Only the community owner or a moderator can unmute members";
                    return result;
                }

                var mutes = await _context.CommunityMutedMembers
                    .Where(m => m.CommunityId == communityId
                        && m.MutedProfileId == targetProfileId
                        && (m.MutedUntil == null || m.MutedUntil > DateTimeOffset.UtcNow))
                    .ToListAsync();

                if (!mutes.Any())
                {
                    result.Message = "Active mute record not found";
                    return result;
                }

                _context.CommunityMutedMembers.RemoveRange(mutes);
                await _context.SaveChangesAsync();
                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while unmuting member: {ex.Message}";
                result.Result = false;
            }
            return result;
        }

        public async Task<ReturnResult<PagedData<SelectCommunityMuteDTO, string>>> GetMutedMembersAsync(string communityId, Page<string> page)
        {
            var result = new ReturnResult<PagedData<SelectCommunityMuteDTO, string>>();
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

                if (!await IsOwnerOrModeratorAsync(communityId, profileId))
                {
                    result.Message = "Only the community owner or a moderator can view muted member records";
                    return result;
                }

                var query = _context.CommunityMutedMembers
                    .Include(m => m.MutedProfile)
                    .Include(m => m.MutedBy)
                    .Where(m => m.CommunityId == communityId)
                    .AsQueryable();

                result.Result = await _muteRepository.GetPagingAsync<Page<string>, SelectCommunityMuteDTO>(query, page);

                if (result.Result?.Data != null)
                {
                    await ApplyMuteManagementPrivacyAsync(profileId, result.Result.Data);
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while retrieving muted records: {ex.Message}";
            }
            return result;
        }

        private async Task ApplyMuteManagementPrivacyAsync(string viewerProfileId, IEnumerable<SelectCommunityMuteDTO> mutes)
        {
            var muteList = mutes.ToList();
            var targetBlockedIds = await CommunityManagementPrivacyHelper.GetBlockedProfileIdsAsync(
                _context,
                viewerProfileId,
                muteList.Select(x => x.MutedProfileId));

            var actorBlockedIds = await CommunityManagementPrivacyHelper.GetBlockedProfileIdsAsync(
                _context,
                viewerProfileId,
                muteList.Select(x => x.MutedById));

            foreach (var item in muteList)
            {
                var targetBlocked = targetBlockedIds.Contains(item.MutedProfileId);
                var actorBlocked = actorBlockedIds.Contains(item.MutedById);
                item.HasBlockedRelation = targetBlocked || actorBlocked;
                item.IsMutedProfileRestricted = targetBlocked;
                item.IsMutedByRestricted = actorBlocked;
                item.RestrictedMessage = item.HasBlockedRelation ? ResponseMessage.BLOCKED_OR_NOT_AVAILABLE : null;
                item.CanUnmute = true;
                item.MutedProfile = CommunityManagementPrivacyHelper.ToManagementProfile(item.MutedProfile, targetBlocked);
                item.MutedBy = CommunityManagementPrivacyHelper.ToManagementProfile(item.MutedBy, actorBlocked);
            }
        }
    }
}
