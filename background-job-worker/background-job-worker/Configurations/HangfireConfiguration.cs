using Hangfire;

namespace background_job_worker.Configurations
{
    public class HangfireConfiguration
    {
        public static void ConfigureGlobalFilters()
        {
            GlobalJobFilters.Filters.Add(new AutomaticRetryAttribute
            {
                Attempts = 5,
                DelaysInSeconds = new[] { 1, 2, 5, 10, 30 },
                OnAttemptsExceeded = AttemptsExceededAction.Delete
            });
        }
    }
}