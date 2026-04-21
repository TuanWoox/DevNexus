using Hangfire;
using platform_core_service.Common.Interfaces.BackgroundJobs;

namespace background_job_worker.Infrastructures
{
    /// <summary>
    /// Static class responsible for registering and scheduling recurring background jobs in Hangfire
    /// </summary>
    public static class BackgroundJobScheduler
    {
        /// <summary>
        /// Registers all scheduled recurring jobs for the application
        /// Should be called during application startup
        /// </summary>
        public static void RegisterScheduledJobs(IServiceProvider serviceProvider)
        {
            // Schedule orphan files cleanup to run every 6 hours
            RecurringJob.AddOrUpdate<IMediaBackgroundJobs>(
                recurringJobId: "media-cleanup-orphan-files",
                methodCall: x => x.CleanUpOrphanFiles(),
                cronExpression: Cron.HourInterval(6), // Runs every 6 hours
                options: new RecurringJobOptions
                {
                    TimeZone = TimeZoneInfo.Utc
                });

            // Schedule abandoned temp folders cleanup to run every 12 hours
            RecurringJob.AddOrUpdate<IMediaBackgroundJobs>(
                recurringJobId: "media-cleanup-abandoned-temp-folders",
                methodCall: x => x.CleanUpAbandonedTempFolders(),
                cronExpression: Cron.HourInterval(12), // Runs every 12 hours
                options: new RecurringJobOptions
                {
                    TimeZone = TimeZoneInfo.Utc
                });
        }
    }
}
