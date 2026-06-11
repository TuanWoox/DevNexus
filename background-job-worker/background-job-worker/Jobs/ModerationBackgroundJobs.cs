using Hangfire;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Interfaces.BackgroundJobs;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Moderation;
using platform_core_service.Common.Utils;
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

        public async Task SubmitPostModerationAsync(string postId, int moderationVersion, string contentHash)
        {
            await SubmitContentModerationAsync(ModerationTargetType.Post, postId, moderationVersion, contentHash);
        }

        public async Task SubmitContentModerationAsync(ModerationTargetType targetType, string targetId, int moderationVersion, string contentHash)
        {
            if (string.IsNullOrWhiteSpace(targetId))
            {
                _logger.LogInformation("Skipped AI moderation submission: target id is empty.");
                return;
            }

            _logger.LogInformation("Starting AI moderation submission for {TargetType} {TargetId}.", targetType, targetId);

            var target = await ResolveModerationTargetAsync(targetType, targetId);
            if (target == null)
            {
                _logger.LogInformation("Skipped AI moderation submission for {TargetType} {TargetId}: target not found.", targetType, targetId);
                return;
            }

            if (target.Deleted)
            {
                _logger.LogInformation("Skipped AI moderation submission for {TargetType} {TargetId}: target is deleted.", targetType, targetId);
                return;
            }

            if (target.ModerationStatus != ModerationStatus.Pending)
            {
                _logger.LogInformation(
                    "Skipped AI moderation submission for {TargetType} {TargetId}: status is {ModerationStatus}.",
                    targetType,
                    targetId,
                    target.ModerationStatus);
                return;
            }

            if (target.ModerationVersion != moderationVersion)
            {
                _logger.LogInformation(
                    "Skipped AI moderation submission for {TargetType} {TargetId}: job version {JobVersion} does not match current version {CurrentVersion}.",
                    targetType,
                    targetId,
                    moderationVersion,
                    target.ModerationVersion);
                return;
            }

            if (!string.Equals(target.ModerationContentHash, contentHash, StringComparison.Ordinal))
            {
                _logger.LogInformation(
                    "Skipped AI moderation submission for {TargetType} {TargetId}: job content hash does not match current hash.",
                    targetType,
                    targetId);
                return;
            }

            try
            {
                var mediaManifest = await BuildMediaManifestAsync(target.Content);
                await _aiWorkerClient.SubmitForModerationAsync(
                    targetType,
                    target.Id,
                    target.Title,
                    target.Content,
                    moderationVersion,
                    contentHash,
                    mediaManifest);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to submit {TargetType} {TargetId} to AI moderation.", targetType, targetId);
                throw;
            }

            _logger.LogInformation("Submitted {TargetType} {TargetId} to AI moderation.", targetType, targetId);
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
                    p.Title,
                    p.Content,
                    p.ModerationVersion,
                    p.ModerationContentHash,
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
                var contentHash = post.ModerationContentHash;
                if (string.IsNullOrWhiteSpace(contentHash))
                {
                    contentHash = ModerationContentHashHelper.Compute(post.Title, post.Content);

                    await _dbContext.Posts
                        .IgnoreQueryFilters()
                        .Where(p => p.Id == post.Id && p.ModerationStatus == ModerationStatus.Pending && !p.Deleted)
                        .ExecuteUpdateAsync(setters => setters.SetProperty(p => p.ModerationContentHash, contentHash));

                    _logger.LogWarning(
                        "Stuck pending moderation watchdog repaired missing moderation hash for post {PostId}.",
                        post.Id);
                }

                _backgroundJobClient.Enqueue<IModerationBackgroundJobs>(
                    job => job.SubmitPostModerationAsync(post.Id, post.ModerationVersion, contentHash));
            }

            _logger.LogWarning(
                "Stuck pending moderation watchdog requeued {Count} posts older than {ThresholdMinutes} minutes. Oldest pending since {OldestPendingSince}.",
                stuckPosts.Count,
                StuckPendingThresholdMinutes,
                stuckPosts.First().PendingSince);
        }

        private async Task<ModerationTarget?> ResolveModerationTargetAsync(ModerationTargetType targetType, string targetId)
        {
            return targetType switch
            {
                ModerationTargetType.Post => await _dbContext.Posts
                    .IgnoreQueryFilters()
                    .Where(p => p.Id == targetId)
                    .Select(p => new ModerationTarget(
                        p.Id,
                        p.Title,
                        p.Content,
                        p.Deleted,
                        p.ModerationStatus,
                        p.ModerationVersion,
                        p.ModerationContentHash))
                    .FirstOrDefaultAsync(),
                ModerationTargetType.Answer => await _dbContext.Answers
                    .IgnoreQueryFilters()
                    .Where(a => a.Id == targetId)
                    .Select(a => new ModerationTarget(
                        a.Id,
                        null,
                        a.Content,
                        a.Deleted,
                        a.ModerationStatus,
                        a.ModerationVersion,
                        a.ModerationContentHash))
                    .FirstOrDefaultAsync(),
                ModerationTargetType.Comment => await _dbContext.Comments
                    .IgnoreQueryFilters()
                    .Where(c => c.Id == targetId)
                    .Select(c => new ModerationTarget(
                        c.Id,
                        null,
                        c.Content,
                        c.Deleted,
                        c.ModerationStatus,
                        c.ModerationVersion,
                        c.ModerationContentHash))
                    .FirstOrDefaultAsync(),
                _ => null
            };
        }

        private async Task<IReadOnlyCollection<ModerationMediaManifestItemDTO>> BuildMediaManifestAsync(string content)
        {
            var references = ModerationContentHashHelper.ExtractContentMediaReferences(content);
            if (references.Count == 0)
            {
                return [];
            }

            var manifest = new List<ModerationMediaManifestItemDTO>();
            foreach (var reference in references)
            {
                var item = await ResolveMediaManifestItemAsync(reference);
                if (item == null)
                {
                    _logger.LogInformation(
                        "Skipped moderation media manifest item: {ContentType} media {MediaId} not found.",
                        reference.ContentType,
                        reference.MediaId);
                    continue;
                }

                if (string.IsNullOrWhiteSpace(item.StoreDestination) || !File.Exists(item.StoreDestination))
                {
                    _logger.LogInformation(
                        "Skipped moderation media manifest item: {ContentType} media {MediaId} file not found.",
                        item.ContentType,
                        item.Id);
                    continue;
                }

                manifest.Add(item);
            }

            return manifest;
        }

        private async Task<ModerationMediaManifestItemDTO?> ResolveMediaManifestItemAsync(ContentMediaReference reference)
        {
            return reference.ContentType switch
            {
                ContentType.Post => await _dbContext.PostMedias
                    .IgnoreQueryFilters()
                    .Where(media => media.Id == reference.MediaId && !media.Deleted)
                    .Select(media => new ModerationMediaManifestItemDTO
                    {
                        Id = media.Id,
                        ContentType = ContentType.Post,
                        MediaType = media.PostMediaType,
                        StoreDestination = media.StoreDestination,
                        Sha256Hash = media.SHA256Hash,
                    })
                    .FirstOrDefaultAsync(),
                ContentType.QA => await _dbContext.QAMedias
                    .IgnoreQueryFilters()
                    .Where(media => media.Id == reference.MediaId && !media.Deleted)
                    .Select(media => new ModerationMediaManifestItemDTO
                    {
                        Id = media.Id,
                        ContentType = ContentType.QA,
                        MediaType = media.QAMediaType,
                        StoreDestination = media.StoreDestination,
                        Sha256Hash = media.SHA256Hash,
                    })
                    .FirstOrDefaultAsync(),
                ContentType.Answer => await _dbContext.AnswerMedias
                    .IgnoreQueryFilters()
                    .Where(media => media.Id == reference.MediaId && !media.Deleted)
                    .Select(media => new ModerationMediaManifestItemDTO
                    {
                        Id = media.Id,
                        ContentType = ContentType.Answer,
                        MediaType = media.AnswerMediaType,
                        StoreDestination = media.StoreDestination,
                        Sha256Hash = media.SHA256Hash,
                    })
                    .FirstOrDefaultAsync(),
                ContentType.Comment => await _dbContext.CommentMedias
                    .IgnoreQueryFilters()
                    .Where(media => media.Id == reference.MediaId && !media.Deleted)
                    .Select(media => new ModerationMediaManifestItemDTO
                    {
                        Id = media.Id,
                        ContentType = ContentType.Comment,
                        MediaType = media.CommentMediaType,
                        StoreDestination = media.StoreDestination,
                        Sha256Hash = media.SHA256Hash,
                    })
                    .FirstOrDefaultAsync(),
                _ => null,
            };
        }

        private sealed record ModerationTarget(
            string Id,
            string? Title,
            string Content,
            bool Deleted,
            ModerationStatus ModerationStatus,
            int ModerationVersion,
            string? ModerationContentHash);
    }
}
