using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMute;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class CommunityMuteService(
        ApplicationDbContext context,
        IUserContext userContext) : ICommunityMuteService
    {
        private readonly ApplicationDbContext _context = context;
        private readonly IUserContext _userContext = userContext;

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
    }
}
