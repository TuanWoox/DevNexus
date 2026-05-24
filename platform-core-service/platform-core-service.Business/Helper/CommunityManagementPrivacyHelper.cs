using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityModerator;
using platform_core_service.Common.Models.DTOs.EntityDTO.Profile;
using platform_core_service.Data;

namespace platform_core_service.Business.Helper
{
    public static class CommunityManagementPrivacyHelper
    {
        public static async Task<HashSet<string>> GetBlockedProfileIdsAsync(
            ApplicationDbContext context,
            string? viewerProfileId,
            IEnumerable<string> targetProfileIds)
        {
            if (string.IsNullOrWhiteSpace(viewerProfileId))
                return [];

            var ids = targetProfileIds
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Distinct()
                .ToList();

            if (ids.Count == 0)
                return [];

            return await context.ProfileBlocks
                .Where(b =>
                    (b.OwnerId == viewerProfileId && ids.Contains(b.BlockedProfileId)) ||
                    (ids.Contains(b.OwnerId) && b.BlockedProfileId == viewerProfileId))
                .Select(b => b.OwnerId == viewerProfileId ? b.BlockedProfileId : b.OwnerId)
                .ToHashSetAsync();
        }

        public static SelectProfileDTO? ToManagementProfile(SelectProfileDTO? profile, bool isBlocked)
        {
            if (profile == null || !isBlocked)
                return profile;

            return new SelectProfileDTO
            {
                Id = profile.Id,
                ApplicationUserId = string.Empty,
                FullName = profile.FullName,
                AvatarUrl = profile.AvatarUrl,
                BackgroundUrl = string.Empty,
                Bio = string.Empty,
                ReputationPoints = 0,
                TechStacks = [],
                IsPrivate = profile.IsPrivate,
                FollowerCount = 0,
                FollowingCount = 0,
                CanViewProfile = false,
                FollowStatus = null,
                CurrentUserFollowId = null,
                CurrentUserRequestId = null
            };
        }

        public static ModeratorProfileDTO? ToManagementModeratorProfile(ModeratorProfileDTO? profile, bool isBlocked)
        {
            if (profile == null || !isBlocked)
                return profile;

            return new ModeratorProfileDTO
            {
                Id = profile.Id,
                FullName = profile.FullName,
                AvatarUrl = profile.AvatarUrl,
                Bio = string.Empty,
                ReputationPoints = 0
            };
        }
    }
}
