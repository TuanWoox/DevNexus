using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Entities.Identities;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Profile;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using ProfileEntity = platform_core_service.Common.Entities.DbEntities.Profile;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Interfaces.MessageBus;
using Hangfire;
using platform_core_service.Common.Interfaces.BackgroundJobs;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Models.DTOs.MessageBusDTO;
using platform_core_service.Common.Attributes;
using Microsoft.Extensions.Configuration;

namespace platform_core_service.Business.Services
{
    public class ProfileService : IProfileService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IUserContext _userContext;
        private readonly IBackgroundJobClient _backgroundJobClient;
        private readonly IConfiguration _configuration;

        public ProfileService
        (
            ApplicationDbContext context, 
            IMapper mapper,
            IUserContext userContext,
            IBackgroundJobClient backgroundJobClient,
            IConfiguration configuration
         )
        {
            _context = context;
            _mapper = mapper;
            _userContext = userContext;
            _backgroundJobClient = backgroundJobClient;
            _configuration = configuration;
        }

        public async Task<ReturnResult<bool>> CreateAsync(CreateProfileDTO createDTO, ApplicationUser? user = null)
        {
            ReturnResult<bool> returnResult = new ReturnResult<bool>();
            try
            {
                // Step 1: Validate input
                if (createDTO == null)
                {
                    returnResult.Message = "Profile data is required";
                    return returnResult;
                }

                // Step 2: Get user ID from provided user object or context
                string userId = user?.Id ?? _userContext.UserId;
                if (string.IsNullOrEmpty(userId))
                {
                    returnResult.Message = "User not authenticated";
                    return returnResult;
                }

                // Step 3: Check if profile already exists for this ApplicationUserId
                var existingProfile = await _context.Profiles
                    .FirstOrDefaultAsync(p => p.ApplicationUserId == userId);

                if (existingProfile != null)
                {
                    returnResult.Message = "Profile already exists for this user";
                    return returnResult;
                }

                // Step 4: Create new profile
                var profile = _mapper.Map<ProfileEntity>(createDTO);
                profile.ApplicationUserId = userId;

                _context.Profiles.Add(profile);
                await _context.SaveChangesAsync();

                returnResult.Result = true;

                //Publsih To Other Source
                _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                    x => x.PublishEntity(_mapper.Map<ProfilePublishDTO>(profile), MessageBusEnum.Create, MessageBusEntityEnum.Profile)
                );
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred while creating profile: {ex.Message}";
            }
            return returnResult;
        }

        public async Task<ReturnResult<SelectProfileDTO>> UpdateAsync(UpdateProfileDTO updateDTO)
        {
            ReturnResult<SelectProfileDTO> returnResult = new ReturnResult<SelectProfileDTO>();
            try
            {
                // Step 1: Validate ID
                if (string.IsNullOrEmpty(updateDTO.Id))
                {
                    returnResult.Message = "Invalid profile ID";
                    return returnResult;
                }

                // Step 2: Load current profile
                var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.Id == updateDTO.Id);
                if (profile == null)
                {
                    returnResult.Message = $"Profile {updateDTO.Id} not found";
                    return returnResult;
                }

                // Step 3: Perform update
                _mapper.Map(updateDTO, profile);
                _context.Profiles.Update(profile);
                await _context.SaveChangesAsync();

                var dto = _mapper.Map<SelectProfileDTO>(profile);
                await EnrichProfileDTO(dto);
                returnResult.Result = dto;

                //Publsih To Other Source Too
                _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                    x => x.PublishEntity(_mapper.Map<ProfilePublishDTO>(profile), MessageBusEnum.Update, MessageBusEntityEnum.Profile)
                );
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred while updating profile: {ex.Message}";
            }
            return returnResult;
        }

        public async Task<ReturnResult<SelectProfileDTO>> GetAsync(string profileId)
        {
            ReturnResult<SelectProfileDTO> returnResult = new ReturnResult<SelectProfileDTO>();
            try
            {
                // Step 1: Validate ID
                if (string.IsNullOrEmpty(profileId))
                {
                    returnResult.Message = "Invalid profile ID";
                    return returnResult;
                }

                // Step 2: Load profile
                var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.Id == profileId);
                if (profile == null)
                {
                    returnResult.Message = $"Profile {profileId} not found";
                    return returnResult;
                }

                var dto = _mapper.Map<SelectProfileDTO>(profile);
                await EnrichProfileDTO(dto);
                returnResult.Result = dto;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred while retrieving profile: {ex.Message}";
            }
            return returnResult;
        }

        //Only used when we update a primary image on profileMedia
        public async Task<ReturnResult<SelectProfileDTO>> UpdateProfileImageUrl([TrimmedRequired] string profileId, string urlId, ProfileMediaType type)
        {
            ReturnResult<SelectProfileDTO> returnResult = new ReturnResult<SelectProfileDTO>();
            try
            {
                // Step 1: Load upcoming updated profile
                var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.Id == profileId);
                if (profile == null)
                {
                    returnResult.Message = $"Profile {profileId} not found";
                    return returnResult;
                }

                // Step 2: Get the baseUrl from the env
                string? baseUrl = _configuration["ApiSettings:ProfileMediaBaseUrl"];
                if (string.IsNullOrEmpty(baseUrl))
                {
                    returnResult.Message = "ProfileMediaBaseUrl is not configured.";
                    return returnResult;
                }

                // Step 3: Perform update base on media type
                string mediaUrl = $"{baseUrl.TrimEnd('/')}/{urlId}";

                if (type == ProfileMediaType.Avatar)
                {
                    profile.AvatarUrl = mediaUrl;
                }
                else if (type == ProfileMediaType.Background)
                {
                    profile.BackgroundUrl = mediaUrl;
                }
                
                _context.Profiles.Update(profile);
                await _context.SaveChangesAsync();

                var dto = _mapper.Map<SelectProfileDTO>(profile);
                await EnrichProfileDTO(dto);
                returnResult.Result = dto;

                //Publish To Other Source Too
                _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                    x => x.PublishEntity(_mapper.Map<ProfilePublishDTO>(profile), MessageBusEnum.Update, MessageBusEntityEnum.Profile)
                );
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred while updating profile: {ex.Message}";
            }
            return returnResult;
        }

        // Enriches a SelectProfileDTO with follow metadata: counts, permissions, and current user's follow status.
        private async Task EnrichProfileDTO(SelectProfileDTO dto)
        {
            var profileId = dto.Id;
            var currentProfileId = _userContext.ProfileId;
            var isOwner = currentProfileId == profileId;

            // 1. Counts — always computed
            dto.FollowerCount = await _context.UserFollows.CountAsync(x => x.FollowingProfileId == profileId);
            dto.FollowingCount = await _context.UserFollows.CountAsync(x => x.OwnerId == profileId);

            // 2. Current user's relationship with this profile
            string? existingFollowId = null;
            string? existingRequestId = null;

            if (!isOwner && !string.IsNullOrEmpty(currentProfileId))
            {
                existingFollowId = await _context.UserFollows
                    .Where(x => x.OwnerId == currentProfileId && x.FollowingProfileId == profileId)
                    .Select(x => x.Id)
                    .FirstOrDefaultAsync();

                if (existingFollowId == null)
                {
                    existingRequestId = await _context.FollowRequests
                        .Where(x => x.RequesterProfileId == currentProfileId && x.TargetProfileId == profileId)
                        .Select(x => x.Id)
                        .FirstOrDefaultAsync();
                }
            }

            // 3. Permission — can the current user view the followers/following lists?
            dto.CanViewProfile = isOwner || !dto.IsPrivate || existingFollowId != null;

            // 4. Follow status
            dto.FollowStatus = isOwner ? null
                : existingFollowId != null ? "following"
                : existingRequestId != null ? "requested"
                : "none";

            dto.CurrentUserFollowId = existingFollowId;
            dto.CurrentUserRequestId = existingRequestId;
        }
    }
}

