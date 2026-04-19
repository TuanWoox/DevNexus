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

namespace platform_core_service.Business.Services
{
    public class ProfileService : IProfileService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IUserContext _userContext;
        private readonly IBackgroundJobClient _backgroundJobClient;

        public ProfileService
        (
            ApplicationDbContext context, 
            IMapper mapper,
            IUserContext userContext,
            IBackgroundJobClient backgroundJobClient 
         )
        {
            _context = context;
            _mapper = mapper;
            _userContext = userContext;
            _backgroundJobClient = backgroundJobClient;
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

                returnResult.Result = _mapper.Map<SelectProfileDTO>(profile);

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

                returnResult.Result = _mapper.Map<SelectProfileDTO>(profile);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                returnResult.Message = $"An error occurred while retrieving profile: {ex.Message}";
            }
            return returnResult;
        }

        //Only used when we update a primary image on profileMedia
        public async Task<ReturnResult<SelectProfileDTO>> UpdateProfileAvatarUrl([TrimmedRequired] string profileId, string urlId)
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

                // Step 2: Perform update
                profile.AvatarUrl = urlId;
                _context.Profiles.Update(profile);
                await _context.SaveChangesAsync();
                returnResult.Result = _mapper.Map<SelectProfileDTO>(profile);
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
    }
}
