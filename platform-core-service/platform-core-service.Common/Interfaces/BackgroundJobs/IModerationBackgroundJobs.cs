namespace platform_core_service.Common.Interfaces.BackgroundJobs
{
    using platform_core_service.Common.Utils.Enums;

    public interface IModerationBackgroundJobs
    {
        Task SubmitPostModerationAsync(string postId, int moderationVersion, string contentHash);
        Task SubmitContentModerationAsync(ModerationTargetType targetType, string targetId, int moderationVersion, string contentHash);
        Task RequeueStuckPendingModerationAsync();
    }
}
