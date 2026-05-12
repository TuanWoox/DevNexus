using Hangfire;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.BackgroundJobs;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Moderation;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class ModerationService : IModerationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IBackgroundJobClient _backgroundJobClient;

        public ModerationService(ApplicationDbContext context, IBackgroundJobClient backgroundJobClient)
        {
            _context = context;
            _backgroundJobClient = backgroundJobClient;
        }

        public async Task<ReturnResult<bool>> HandleCallbackAsync(ModerationCallbackDTO dto)
        {
            var result = new ReturnResult<bool>();
            try
            {
                // Use IgnoreQueryFilters so we can still handle callbacks for soft-deleted posts
                // (Race condition: user deleted post while AI pipeline was running)
                // Load only the base post first — Author/Tags are loaded conditionally below
                var post = await _context.Posts
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(p => p.Id == dto.PostId);

                if (post == null)
                {
                    result.Message = $"Post {dto.PostId} not found.";
                    return result;
                }

                // Idempotency guard — if already processed, return success silently
                // Prevents double-processing if AI Worker retries the callback
                if (post.ModerationStatus != ModerationStatus.Pending)
                {
                    DevNexusLogger.Instance.Debug(
                        $"[Moderation] Callback ignored for post {dto.PostId} — already in status {post.ModerationStatus}");
                    result.Result = true;
                    return result;
                }

                // If the post was soft-deleted while AI was processing — ignore, do not republish
                if (post.Deleted)
                {
                    DevNexusLogger.Instance.Debug(
                        $"[Moderation] Callback ignored for post {dto.PostId} — post was deleted.");
                    result.Result = true;
                    return result;
                }

                // Map AI Worker decision string → ModerationStatus enum
                post.ModerationStatus = dto.Decision.ToLower() switch
                {
                    "approve"  => ModerationStatus.Approved,
                    "flag"     => ModerationStatus.Flagged,
                    "escalate" => ModerationStatus.InReview,
                    _ => ModerationStatus.InReview  // unknown decision → escalate to be safe
                };

                // Create immutable audit record of AI scoring
                var moderationResult = new PostModerationResult
                {
                    Id = Guid.NewGuid().ToString(),
                    PostId = dto.PostId,
                    TextScore = dto.TextScore,
                    ImageScore = dto.ImageScore,
                    CombinedScore = dto.CombinedScore,
                    Decision = dto.Decision,
                    Reasoning = dto.Reasoning,
                    ReviewedAt = DateTimeOffset.UtcNow,
                };

                _context.PostModerationResults.Add(moderationResult);
                _context.Posts.Update(post);
                await _context.SaveChangesAsync();

                DevNexusLogger.Instance.Debug(
                    $"[Moderation] Post {dto.PostId} → {post.ModerationStatus} (decision={dto.Decision})");

                if (post.ModerationStatus == ModerationStatus.Approved && post is QAPost)
                {
                    // Load Author and Tags now that we know this is a QA post
                    await _context.Entry(post).Reference(p => p.Author).LoadAsync();
                    await _context.Entry(post).Collection(p => p.PostTags).Query()
                        .Include(pt => pt.Tag).LoadAsync();

                    var aiRequest = new platform_core_service.Common.Models.DTOs.AIDTO.AIFirstResponderRequestDTO
                    {
                        PostId = post.Id,
                        Title = post.Title,
                        Content = post.Content,
                        Tags = post.PostTags?.Select(pt => pt.Tag.Name).ToList() ?? new List<string>(),
                        AuthorId = post.AuthorId,
                        AuthorDisplayName = post.Author?.FullName ?? "Unknown",
                        CreatedAt = post.DateCreated ?? DateTimeOffset.UtcNow
                    };

                    string routingKey = "ai.task.firstresponder.request";

                    _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                        x => x.PublicAiTask(aiRequest, routingKey, MessageBusEnum.Create, MessageBusEntityEnum.AIFirstResponder)
                    );

                    DevNexusLogger.Instance.Debug($"[Moderation] AI First Responder Task queued for QA Post {post.Id}");
                }

                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while processing moderation callback: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<ModerationQueueResponseDTO>> EnqueueForReviewAsync(ModerationQueueRequestDTO dto)
        {
            var result = new ReturnResult<ModerationQueueResponseDTO>();
            try
            {
                var post = await _context.Posts
                    .IgnoreQueryFilters()
                    .AnyAsync(p => p.Id == dto.PostId);

                if (!post)
                {
                    result.Message = $"Post {dto.PostId} not found.";
                    return result;
                }

                var entry = new ModerationQueueEntry
                {
                    Id = Guid.NewGuid().ToString(),
                    PostId = dto.PostId,
                    Reason = dto.Reason,
                    Tier1Score = dto.Tier1Score,
                    Tier2Reasoning = dto.Tier2Reasoning,
                };

                _context.ModerationQueueEntries.Add(entry);
                await _context.SaveChangesAsync();

                DevNexusLogger.Instance.Debug(
                    $"[Moderation] Queue entry {entry.Id} created for post {dto.PostId}");

                result.Result = new ModerationQueueResponseDTO { Id = entry.Id };
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while creating moderation queue entry: {ex.Message}";
            }
            return result;
        }
    }
}
