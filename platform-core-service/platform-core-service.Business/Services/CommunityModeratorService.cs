using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityModerator;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using CommunityModeratorEntity = platform_core_service.Common.Entities.DbEntities.CommunityModerator;

namespace platform_core_service.Business.Services
{
    public class CommunityModeratorService(
        ApplicationDbContext context,
        IMapper mapper,
        IUserContext userContext,
        IRepository<CommunityModeratorEntity, string> moderatorRepository) : ICommunityModeratorService
    {
        private readonly ApplicationDbContext _context = context;
        private readonly IMapper _mapper = mapper;
        private readonly IUserContext _userContext = userContext;
        private readonly IRepository<CommunityModeratorEntity, string> _moderatorRepository = moderatorRepository;

        public async Task<ReturnResult<SelectCommunityModeratorDTO>> AddAsync(CreateCommunityModeratorDTO createDTO)
        {
            var result = new ReturnResult<SelectCommunityModeratorDTO>();
            try
            {
                // Step 1: Validate input
                if (createDTO == null)
                {
                    result.Message = "Moderator data is required";
                    return result;
                }

                // Step 2: Check caller identity
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                // Step 3: Verify community exists
                var community = await _context.Communities
                    .FirstOrDefaultAsync(c => c.Id == createDTO.CommunityId);

                if (community == null)
                {
                    result.Message = $"Community {createDTO.CommunityId} not found";
                    return result;
                }

                // Step 4: Only the community owner can add moderators
                if (community.OwnerId != profileId)
                {
                    result.Message = "Only the community owner can add moderators";
                    return result;
                }

                // Step 4b: Owner is already the highest authority — cannot be made a Moderator
                if (createDTO.ModeratorId == community.OwnerId)
                {
                    result.Message = "The owner has full privileges by default and does not need to become a moderator.";
                    return result;
                }

                // Step 5: Owner cannot add themselves as a moderator (self-promote guard)
                if (createDTO.ModeratorId == profileId)
                {
                    result.Message = "The community owner cannot be added as a moderator";
                    return result;
                }

                // Step 6: Prevent duplicate moderator entries
                var alreadyExists = await _context.CommunityModerators
                    .AnyAsync(m => m.CommunityId == createDTO.CommunityId
                               && m.ModeratorId == createDTO.ModeratorId);

                if (alreadyExists)
                {
                    result.Message = "This user is already a moderator of this community";
                    return result;
                }

                // Step 7: Verify the target profile is a member of the community
                var isMember = await _context.CommunityMembers
                    .AnyAsync(m => m.CommunityId == createDTO.CommunityId
                               && m.ProfileId == createDTO.ModeratorId);

                if (!isMember)
                {
                    result.Message = "The user must be a member of the community before being added as a moderator";
                    return result;
                }

                // Step 8: Verify the target profile exists
                var moderatorProfile = await _context.Profiles
                    .FirstOrDefaultAsync(p => p.Id == createDTO.ModeratorId);

                if (moderatorProfile == null)
                {
                    result.Message = $"Profile {createDTO.ModeratorId} not found";
                    return result;
                }

                // Step 8: Save
                var moderator = _mapper.Map<CommunityModeratorEntity>(createDTO);
                moderator.Id = Guid.NewGuid().ToString();

                _context.CommunityModerators.Add(moderator);
                await _context.SaveChangesAsync();

                // Step 9: Map with profile included
                var savedEntry = await _context.CommunityModerators
                    .Include(m => m.Moderator)
                    .FirstAsync(m => m.Id == moderator.Id);

                result.Result = _mapper.Map<SelectCommunityModeratorDTO>(savedEntry);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while adding moderator: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<bool>> RemoveAsync(string moderatorEntryId)
        {
            var result = new ReturnResult<bool>();
            try
            {
                // Step 1: Validate input
                if (string.IsNullOrEmpty(moderatorEntryId))
                {
                    result.Message = "Moderator entry ID is required";
                    return result;
                }

                // Step 2: Check caller identity
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                // Step 3: Load the moderator entry
                var entry = await _context.CommunityModerators
                    .FirstOrDefaultAsync(m => m.Id == moderatorEntryId);

                if (entry == null)
                {
                    result.Message = $"Moderator entry {moderatorEntryId} not found";
                    return result;
                }

                // Step 4: Load the community and verify ownership
                var community = await _context.Communities
                    .FirstOrDefaultAsync(c => c.Id == entry.CommunityId);

                if (community == null || community.OwnerId != profileId)
                {
                    result.Message = "Only the community owner can remove moderators";
                    return result;
                }

                // Step 5: Remove
                _context.CommunityModerators.Remove(entry);
                await _context.SaveChangesAsync();

                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while removing moderator: {ex.Message}";
                result.Result = false;
            }
            return result;
        }

        public async Task<ReturnResult<PagedData<SelectCommunityModeratorDTO, string>>> GetByCommunityAsync(string communityId, Page<string> page)
        {
            var result = new ReturnResult<PagedData<SelectCommunityModeratorDTO, string>>();
            try
            {
                // Step 1: Validate input
                if (string.IsNullOrEmpty(communityId))
                {
                    result.Message = "Community ID is required";
                    return result;
                }

                // Step 2: Build query with profile loaded
                var query = _context.CommunityModerators
                    .Include(m => m.Moderator)
                    .Where(m => m.CommunityId == communityId)
                    .AsQueryable();

                // Step 3: Get paged results
                result.Result = await _moderatorRepository.GetPagingAsync<Page<string>, SelectCommunityModeratorDTO>(query, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while retrieving moderators: {ex.Message}";
            }
            return result;
        }
    }
}
