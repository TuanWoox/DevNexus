namespace platform_core_service.Common.Interfaces.BackgroundJobs
{
    public interface IModerationBackgroundJobs
    {
        Task SubmitPostModerationAsync(string postId);
        Task RequeueStuckPendingModerationAsync();
    }
}
