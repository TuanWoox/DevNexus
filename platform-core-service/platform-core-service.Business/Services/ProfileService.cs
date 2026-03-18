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
using shared_contracts.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Business.Services
{
    public class ProfileService : IProfileService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IUserContext _userContext;
        private readonly ITokenService _tokenService;
        private readonly UserManager<ApplicationUser> _userManager;

        public ProfileService(ApplicationDbContext context, IMapper mapper, IUserContext userContext, ITokenService tokenService, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _mapper = mapper;
            _userContext = userContext;
            _tokenService = tokenService;
            _userManager = userManager;
        }

        public async Task<ReturnResult<TokenResponseDTO>> CreateAsync(CreateProfileDTO createDTO)
        {
            ReturnResult<TokenResponseDTO> returnResult = new ReturnResult<TokenResponseDTO>();
            try
            {
                // Step 1: Validate authentication
                if (string.IsNullOrEmpty(_userContext.UserId))
                {
                    returnResult.Message = "User not authenticated";
                    return returnResult;
                }

                // Step 2: Check if profile already exists for this ApplicationUserId
                var existingProfile = await _context.Profiles
                    .FirstOrDefaultAsync(p => p.ApplicationUserId == _userContext.UserId);

                if (existingProfile != null)
                {
                    returnResult.Message = "Profile already exists for this user";
                    return returnResult;
                }

                // Step 3: Create new profile
                var profile = _mapper.Map<ProfileEntity>(createDTO);
                profile.ApplicationUserId = _userContext.UserId;

                _context.Profiles.Add(profile);
                await _context.SaveChangesAsync();

                // Step 4: Get the user and issue new token with profileId
                var user = await _userManager.FindByIdAsync(_userContext.UserId);
                if (user != null)
                {
                    returnResult.Result = await _tokenService.IssueTokens(user, rememberMe: true);
                }
                else
                {
                    returnResult.Message = "User not found";
                }
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
    }
}
