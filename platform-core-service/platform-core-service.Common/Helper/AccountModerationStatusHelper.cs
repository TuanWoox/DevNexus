using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Common.Helper
{
    public static class AccountModerationStatusHelper
    {
        public static AccountModerationStatusDTO FromProfile(Profile profile)
        {
            return new AccountModerationStatusDTO
            {
                IsSuspended = profile.IsSuspended,
                IsPermanentBan = profile.IsSuspended && profile.SuspendedUntil == null,
                SuspendedUntil = profile.SuspendedUntil,
                Reason = profile.SuspensionReason
            };
        }

        public static string BuildSuspensionMessage(Profile profile)
        {
            return profile.SuspendedUntil == null
                ? "Your account has been permanently suspended."
                : $"Your account has been suspended until {profile.SuspendedUntil:MMM dd, yyyy HH:mm} UTC.";
        }
    }
}
