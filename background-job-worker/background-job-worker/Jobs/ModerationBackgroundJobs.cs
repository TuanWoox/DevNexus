using Hangfire;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Interfaces.BackgroundJobs;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Data;

namespace background_job_worker.Jobs
{
    public class ModerationBackgroundJobs(
        ApplicationDbContext dbContext,
        IAiWorkerClient aiWorkerClient,
        IBackgroundJobClient backgroundJobClient,
        ILogger<ModerationBackgroundJobs> logger) : IModerationBackgroundJobs
    {
        private const int StuckPendingThresholdMinutes = 30;
        private const int StuckPendingBatchSize = 100;

        private readonly ApplicationDbContext _dbContext = dbContext;
        private readonly IAiWorkerClient _aiWorkerClient = aiWorkerClient;
        private readonly IBackgroundJobClient _backgroundJobClient = backgroundJobClient;
        private readonly ILogger<ModerationBackgroundJobs> _logger = logger;

        public async Task SubmitPostModerationAsync(string postId)
        {
            if (string.IsNullOrWhiteSpace(postId))
            {
                _logger.LogInformation("Skipped AI moderation submission: post id is empty.");
                return;
            }

            _logger.LogInformation("Starting AI moderation submission for post {PostId}.", postId);

            var post = await _dbContext.Posts
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.Id == postId);

            if (post == null)
            {
                _logger.LogInformation("Skipped AI moderation submission for post {PostId}: post not found.", postId);
                return;
            }

            if (post.Deleted)
            {
                _logger.LogInformation("Skipped AI moderation submission for post {PostId}: post is deleted.", postId);
                return;
            }

            if (post.ModerationStatus != ModerationStatus.Pending)
            {
                _logger.LogInformation(
                    "Skipped AI moderation submission for post {PostId}: status is {ModerationStatus}.",
                    postId,
                    post.ModerationStatus);
                return;
            }

            try
            {
                await _aiWorkerClient.SubmitForModerationAsync(post.Id, post.Title, post.Content);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to submit post {PostId} to AI moderation.", postId);
                throw;
            }

            _logger.LogInformation("Submitted post {PostId} to AI moderation.", postId);
        }

        public async Task RequeueStuckPendingModerationAsync()
        {
            var cutoff = DateTimeOffset.UtcNow.AddMinutes(-StuckPendingThresholdMinutes);

            var stuckPosts = await _dbContext.Posts
                .IgnoreQueryFilters()
                .AsNoTracking()
                .Where(p =>
                    !p.Deleted &&
                    p.ModerationStatus == ModerationStatus.Pending &&
                    (p.DateModified ?? p.DateCreated) != null &&
                    (p.DateModified ?? p.DateCreated) <= cutoff)
                .OrderBy(p => p.DateModified ?? p.DateCreated)
                .Select(p => new
                {
                    p.Id,
                    PendingSince = p.DateModified ?? p.DateCreated,
                })
                .Take(StuckPendingBatchSize)
                .ToListAsync();

            if (stuckPosts.Count == 0)
            {
                _logger.LogInformation(
                    "Stuck pending moderation watchdog found no posts older than {ThresholdMinutes} minutes.",
                    StuckPendingThresholdMinutes);
                return;
            }

            foreach (var post in stuckPosts)
            {
                _backgroundJobClient.Enqueue<IModerationBackgroundJobs>(
                    job => job.SubmitPostModerationAsync(post.Id));
            }

            _logger.LogWarning(
                "Stuck pending moderation watchdog requeued {Count} posts older than {ThresholdMinutes} minutes. Oldest pending since {OldestPendingSince}.",
                stuckPosts.Count,
                StuckPendingThresholdMinutes,
                stuckPosts.First().PendingSince);
        }
    }
}
