using Hangfire;

namespace background_job_worker.Jobs
{
    public class SampleJob
    {
        private readonly ILogger<SampleJob> _logger;

        public SampleJob(ILogger<SampleJob> logger)
        {
            _logger = logger;
        }

        public async Task ExecuteAsync(string message)
        {
            _logger.LogInformation("Sample job started with message: {Message}", message);

            // Simulate some work
            await Task.Delay(2000);

            _logger.LogInformation("Sample job completed successfully");
        }
    }

    public static class SampleJobExtensions
    {
        // Fire-and-forget job example
        public static string EnqueueSampleJob(this IBackgroundJobClient jobClient, string message)
        {
            return jobClient.Enqueue<SampleJob>(job => job.ExecuteAsync(message));
        }

        // Delayed job example
        public static string ScheduleSampleJob(this IBackgroundJobClient jobClient, string message, TimeSpan delay)
        {
            return jobClient.Schedule<SampleJob>(job => job.ExecuteAsync(message), delay);
        }

        // Recurring job example
        public static void AddRecurringSampleJob(this IRecurringJobManager recurringJobManager, string jobId, string cronExpression, string message)
        {
            recurringJobManager.AddOrUpdate<SampleJob>(
                jobId,
                job => job.ExecuteAsync(message),
                cronExpression);
        }
    }
}
