using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Recommendations;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.UserContentInteraction;
using platform_core_service.Common.Models.DTOs.EntityDTO.UserRecommendationFeedback;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;

namespace platform_core_service.Business.Recommendations
{
    public class InteractionService : IInteractionService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICacheService _cache;

        public InteractionService(ApplicationDbContext context, ICacheService cache)
        {
            _context = context;
            _cache = cache;
        }

        public async Task<ReturnResult<bool>> TrackAsync(string userId, SelectUserContentInteractionDTO dto)
        {
            var result = new ReturnResult<bool>();
            try
            {
                if (dto == null || (string.IsNullOrEmpty(dto.PostId) && string.IsNullOrEmpty(dto.QAPostId)))
                {
                    result.Message = "PostId or QAPostId is required";
                    return result;
                }

                if (!string.IsNullOrEmpty(dto.PostId) && !await _context.Posts.AnyAsync(p => p.Id == dto.PostId))
                {
                    result.Message = "Post not found";
                    return result;
                }

                if (!string.IsNullOrEmpty(dto.QAPostId) && !await _context.Posts.OfType<QAPost>().AnyAsync(p => p.Id == dto.QAPostId))
                {
                    result.Message = "QAPost not found";
                    return result;
                }

                _context.UserContentInteractions.Add(new UserContentInteraction
                {
                    UserId = userId,
                    PostId = dto.PostId,
                    QAPostId = dto.QAPostId,
                    InteractionType = NormalizeInteractionType(dto.InteractionType),
                    DwellTimeSeconds = dto.DwellTimeSeconds,
                    Source = string.IsNullOrWhiteSpace(dto.Source) ? null : dto.Source.Trim().ToLowerInvariant()
                });

                await _context.SaveChangesAsync();
                await _cache.RemoveCacheAsync($"interest_profile:{userId}");

                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while tracking interaction: {ex.Message}";
            }

            return result;
        }

        public async Task<ReturnResult<bool>> SubmitFeedbackAsync(string userId, CreateUserRecommendationFeedbackDTO dto)
        {
            var result = new ReturnResult<bool>();
            try
            {
                if (dto == null || (string.IsNullOrEmpty(dto.PostId) && string.IsNullOrEmpty(dto.QAPostId) && string.IsNullOrEmpty(dto.CommunityId)))
                {
                    result.Message = "PostId, QAPostId, or CommunityId is required";
                    return result;
                }

                var feedbackType = ParseFeedbackType(dto.FeedbackType);
                _context.UserRecommendationFeedbacks.Add(new UserRecommendationFeedback
                {
                    UserId = userId,
                    PostId = dto.PostId,
                    QAPostId = dto.QAPostId,
                    CommunityId = dto.CommunityId,
                    FeedbackType = feedbackType
                });

                await _context.SaveChangesAsync();
                await _cache.RemoveCacheAsync($"interest_profile:{userId}");

                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while submitting feedback: {ex.Message}";
            }

            return result;
        }

        private static string NormalizeInteractionType(string? interactionType)
        {
            var value = string.IsNullOrWhiteSpace(interactionType)
                ? "view"
                : interactionType.Trim().ToLowerInvariant();

            return value is "view" or "dwell" or "click" or "share" ? value : "view";
        }

        private static FeedBackType ParseFeedbackType(string? feedbackType)
        {
            var normalized = (feedbackType ?? string.Empty).Replace("_", string.Empty);
            return Enum.TryParse<FeedBackType>(normalized, true, out var parsed)
                ? parsed
                : FeedBackType.NotInterested;
        }
    }
}
