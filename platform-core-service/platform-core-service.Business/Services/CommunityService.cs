using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Helpers;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Community;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using CommunityEntity = platform_core_service.Common.Entities.DbEntities.Community;

namespace platform_core_service.Business.Services
{
    public class CommunityService(
        ApplicationDbContext context,
        IMapper mapper,
        IUserContext userContext,
        IRepository<CommunityEntity, string> communityRepository,
        IConfiguration configuration) : ICommunityService
    {
        private readonly ApplicationDbContext _context = context;
        private readonly IMapper _mapper = mapper;
        private readonly IUserContext _userContext = userContext;
        private readonly IRepository<CommunityEntity, string> _communityRepository = communityRepository;
        private readonly IConfiguration _configuration = configuration;

        public async Task<ReturnResult<SelectCommunityDTO>> CreateAsync(CreateCommunityDTO createDTO)
        {
            var result = new ReturnResult<SelectCommunityDTO>();
            try
            {
                // Step 1: Validate input
                if (createDTO == null)
                {
                    result.Message = "Community data is required";
                    return result;
                }

                // Step 2: Check authentication
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                // Step 3: Map DTO to entity
                var community = _mapper.Map<CommunityEntity>(createDTO);
                community.Id = Guid.NewGuid().ToString();
                community.OwnerId = profileId;

                // Step 4: Auto-generate slug if not provided
                if (string.IsNullOrEmpty(community.Slug))
                {
                    var baseSlug = HelperUtils.GenerateSlug(community.Name);
                    community.Slug = $"{baseSlug}-{community.Id[..8]}";
                }
                else
                {
                    community.Slug = $"{community.Slug}-{community.Id[..8]}";
                }

                // Step 5: Save
                _context.Communities.Add(community);
                await _context.SaveChangesAsync();

                result.Result = _mapper.Map<SelectCommunityDTO>(community);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while creating community: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<SelectCommunityDTO>> GetByIdAsync(string communityId)
        {
            var result = new ReturnResult<SelectCommunityDTO>();
            try
            {
                // Step 1: Validate ID
                if (string.IsNullOrEmpty(communityId))
                {
                    result.Message = "Community ID is required";
                    return result;
                }

                // Step 2: Load (public read — no ownership check; supports id or slug)
                var community = await _context.Communities
                    .FirstOrDefaultAsync(c => c.Id == communityId || c.Slug == communityId);

                if (community == null)
                {
                    result.Message = $"Community {communityId} not found";
                    return result;
                }

                // Step 3: Check if the caller is banned from this community
                var profileId = _userContext.ProfileId;
                if (!string.IsNullOrEmpty(profileId))
                {
                    var isBanned = await _context.CommunityBans
                        .AnyAsync(b => b.CommunityId == community.Id && b.BannedProfileId == profileId);

                    if (isBanned)
                    {
                        result.Message = "You have been banned from this community";
                        return result;
                    }
                }

                result.Result = _mapper.Map<SelectCommunityDTO>(community);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while retrieving community: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<PagedData<SelectCommunityDTO, string>>> GetPageAsync(Page<string> page)
        {
            var result = new ReturnResult<PagedData<SelectCommunityDTO, string>>();
            try
            {
                // Step 1: Get current user profile
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                // Step 2: Build query for caller's communities, excluding ones they are banned from
                var bannedCommunityIds = await _context.CommunityBans
                    .Where(b => b.BannedProfileId == profileId)
                    .Select(b => b.CommunityId)
                    .ToListAsync();

                var query = _context.Communities
                    .Where(c => c.OwnerId == profileId && !bannedCommunityIds.Contains(c.Id))
                    .AsQueryable();

                // Step 3: Get paged results
                result.Result = await _communityRepository.GetPagingAsync<Page<string>, SelectCommunityDTO>(query, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while retrieving communities: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<SelectCommunityDTO>> UpdateAsync(UpdateCommunityDTO updateDTO)
        {
            var result = new ReturnResult<SelectCommunityDTO>();
            try
            {
                // Step 1: Validate input
                if (updateDTO == null || string.IsNullOrEmpty(updateDTO.Id))
                {
                    result.Message = "Update data with valid ID is required";
                    return result;
                }

                var communityId = updateDTO.Id;

                // Step 2: Load entity
                var community = await _context.Communities
                    .FirstOrDefaultAsync(c => c.Id == communityId);

                if (community == null)
                {
                    result.Message = $"Community {communityId} not found";
                    return result;
                }

                // Step 3: Check ownership
                var profileId = _userContext.ProfileId;
                if (community.OwnerId != profileId)
                {
                    result.Message = "You do not have permission to update this community";
                    return result;
                }

                // Step 4: Apply updates
                var oldSlug = community.Slug;
                _mapper.Map(updateDTO, community);

                // Step 5: Handle slug — keep unique suffix
                if (!string.IsNullOrEmpty(updateDTO.Slug) && !updateDTO.Slug.Contains(communityId[..8]))
                {
                    community.Slug = $"{updateDTO.Slug}-{communityId[..8]}";
                }
                else
                {
                    community.Slug = oldSlug;
                }

                // Step 6: Save
                _context.Communities.Update(community);
                await _context.SaveChangesAsync();

                result.Result = _mapper.Map<SelectCommunityDTO>(community);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while updating community: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<bool>> DeleteByIdAsync(string communityId)
        {
            var result = new ReturnResult<bool>();
            try
            {
                // Step 1: Validate ID
                if (string.IsNullOrEmpty(communityId))
                {
                    result.Message = "Community ID is required";
                    return result;
                }

                // Step 2: Load entity
                var community = await _context.Communities
                    .FirstOrDefaultAsync(c => c.Id == communityId);

                if (community == null)
                {
                    result.Message = $"Community {communityId} not found";
                    return result;
                }

                // Step 3: Check ownership
                var profileId = _userContext.ProfileId;
                if (community.OwnerId != profileId)
                {
                    result.Message = "You do not have permission to delete this community";
                    return result;
                }

                // Step 4: Delete
                _context.Communities.Remove(community);
                await _context.SaveChangesAsync();

                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while deleting community: {ex.Message}";
                result.Result = false;
            }
            return result;
        }

        public async Task<ReturnResult<int>> DeleteByIdsAsync(List<string> communityIds)
        {
            var result = new ReturnResult<int>();
            try
            {
                // Step 1: Validate input
                if (communityIds == null || communityIds.Count == 0)
                {
                    result.Message = "Community IDs are required";
                    return result;
                }

                // Step 2: Get current user profile
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(profileId))
                {
                    result.Message = "User profile not found";
                    return result;
                }

                // Step 3: Validate ownership for all requested IDs
                var ownedCount = await _context.Communities
                    .Where(c => communityIds.Contains(c.Id) && c.OwnerId == profileId)
                    .CountAsync();

                if (ownedCount != communityIds.Count)
                {
                    result.Message = "Some communities do not belong to you or have already been deleted";
                    return result;
                }

                // Step 4: Bulk delete
                var toDelete = await _context.Communities
                    .Where(c => communityIds.Contains(c.Id))
                    .ToListAsync();

                _context.Communities.RemoveRange(toDelete);
                await _context.SaveChangesAsync();

                result.Result = toDelete.Count;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while deleting communities: {ex.Message}";
                result.Result = 0;
            }
            return result;
        }

        //Only used when we update a primary image on communityMedia
        public async Task<ReturnResult<SelectCommunityDTO>> UpdateCommunityCoverPhotoUrl(string communityId, string mediaId)
        {
            var result = new ReturnResult<SelectCommunityDTO>();
            try
            {
                var community = await _context.Communities.FirstOrDefaultAsync(c => c.Id == communityId);
                if (community == null)
                {
                    result.Message = $"Community {communityId} not found";
                    return result;
                }

                string? baseUrl = _configuration["ApiSettings:CommunityMediaBaseUrl"];
                if (string.IsNullOrEmpty(baseUrl))
                {
                    result.Message = "CommunityMediaBaseUrl is not configured";
                    return result;
                }

                string mediaUrl = $"{baseUrl.TrimEnd('/')}/{mediaId}";

                community.CommunityCoverPhotoUrl = mediaUrl;
                _context.Communities.Update(community);
                await _context.SaveChangesAsync();
                result.Result = _mapper.Map<SelectCommunityDTO>(community);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while updating community cover photo: {ex.Message}";
            }
            return result;
        }
    }
}
