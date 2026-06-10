using System.Collections.Concurrent;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Utils.Extensions;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.BackgroundJobs;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.AIDTO;
using platform_core_service.Common.Models.DTOs.MessageBusDTO;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class QAPostFirstResponderTriggerService : IQAPostFirstResponderTriggerService
    {
        private const string RoutingKey = "ai.task.firstresponder.request";
        private static readonly ConcurrentDictionary<string, SemaphoreSlim> PostLocks = new();
        private static readonly ConcurrentDictionary<string, byte> EnqueuedPostIds = new();

        private readonly ApplicationDbContext _context;
        private readonly IBackgroundJobClient _backgroundJobClient;

        public QAPostFirstResponderTriggerService(
            ApplicationDbContext context,
            IBackgroundJobClient backgroundJobClient)
        {
            _context = context;
            _backgroundJobClient = backgroundJobClient;
        }

        public async Task<bool> TryEnqueueAsync(string qaPostId, string source)
        {
            if (string.IsNullOrWhiteSpace(qaPostId))
            {
                return false;
            }

            var postLock = PostLocks.GetOrAdd(qaPostId, _ => new SemaphoreSlim(1, 1));
            await postLock.WaitAsync();
            try
            {
                var qaPost = await _context.Posts
                    .IgnoreQueryFilters()
                    .OfType<QAPost>()
                    .Include(q => q.Author)
                    .Include(q => q.PostTags)
                        .ThenInclude(pt => pt.Tag)
                    .FirstOrDefaultAsync(q => q.Id == qaPostId);

                if (qaPost == null)
                {
                    DevNexusLogger.Instance.Debug($"[{source}] Skipped AI First Responder because QA Post {qaPostId} was not found");
                    return false;
                }

                if (qaPost.Deleted)
                {
                    DevNexusLogger.Instance.Debug($"[{source}] Skipped AI First Responder for QA Post {qaPost.Id} because it is deleted");
                    return false;
                }

                if (qaPost.ModerationStatus != ModerationStatus.Approved)
                {
                    DevNexusLogger.Instance.Debug($"[{source}] Skipped AI First Responder for QA Post {qaPost.Id} because status is {qaPost.ModerationStatus}");
                    return false;
                }

                if (await _context.Answers.HasExistingAiFirstResponderAnswerAsync(qaPost.Id))
                {
                    DevNexusLogger.Instance.Debug($"[{source}] Skipped AI First Responder for QA Post {qaPost.Id} because an AI answer already exists");
                    return false;
                }

                if (EnqueuedPostIds.ContainsKey(qaPost.Id))
                {
                    DevNexusLogger.Instance.Debug($"[{source}] Skipped AI First Responder for QA Post {qaPost.Id} because a task was already enqueued by this app instance");
                    return false;
                }

                var aiRequest = new AIFirstResponderRequestDTO
                {
                    PostId = qaPost.Id,
                    Title = qaPost.Title,
                    Content = qaPost.Content,
                    Tags = qaPost.PostTags?.Select(pt => pt.Tag.Name).ToList() ?? new List<string>(),
                    AuthorId = qaPost.AuthorId,
                    AuthorDisplayName = qaPost.Author?.FullName ?? "Unknown",
                    CreatedAt = qaPost.DateCreated ?? DateTimeOffset.UtcNow
                };

                _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                    x => x.PublicAiTask(aiRequest, RoutingKey, MessageBusEnum.Create, MessageBusEntityEnum.AIFirstResponder)
                );
                EnqueuedPostIds.TryAdd(qaPost.Id, 0);

                DevNexusLogger.Instance.Debug($"[{source}] AI First Responder task queued for QA Post {qaPost.Id}");
                return true;
            }
            finally
            {
                postLock.Release();
            }
        }
    }
}
