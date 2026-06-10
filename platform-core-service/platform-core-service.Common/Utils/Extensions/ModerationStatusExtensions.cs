using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Common.Utils.Extensions
{
    public static class ModerationStatusExtensions
    {
        public static bool IsPubliclyVisible(this ModerationStatus status)
        {
            return status is ModerationStatus.Pending or ModerationStatus.Approved or ModerationStatus.InReview;
        }

        public static bool IsHiddenByModeration(this ModerationStatus status)
        {
            return status is ModerationStatus.Flagged;
        }

    }
}
