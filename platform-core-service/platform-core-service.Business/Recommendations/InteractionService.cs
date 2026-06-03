using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Contexts;
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
        private readonly IUserContext _userContext;

        public InteractionService(
            ApplicationDbContext context,
            ICacheService cache,
            IUserContext userContext)
        {
            _context = context;
            _cache = cache;
            _userContext = userContext;
        }

        public async Task<ReturnResult<bool>> TrackAsync(SelectUserContentInteractionDTO dto)
        {
            var result = new ReturnResult<bool>();
            try
            {
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrWhiteSpace(profileId))
                {
                    result.Message = "Profile context is missing";
                    return result;
                }

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

                var interactionType = NormalizeInteractionType(dto.InteractionType);
                var source = string.IsNullOrWhiteSpace(dto.Source) ? null : dto.Source.Trim().ToLowerInvariant();
                var shouldInvalidateProfile = false;

                var existingInteraction = await _context.UserContentInteractions
                    .FirstOrDefaultAsync(i =>
                        i.ProfileId == profileId &&
                        i.PostId == dto.PostId &&
                        i.QAPostId == dto.QAPostId &&
                        i.InteractionType == interactionType &&
                        i.Source == source);

                if (existingInteraction != null)
                {
                    if (dto.DwellTimeSeconds.HasValue)
                    {
                        var dwellTimeSeconds = Math.Max(
                            existingInteraction.DwellTimeSeconds ?? 0,
                            dto.DwellTimeSeconds.Value);

                        if (existingInteraction.DwellTimeSeconds != dwellTimeSeconds)
                        {
                            existingInteraction.DwellTimeSeconds = dwellTimeSeconds;
                            shouldInvalidateProfile = true;
                        }
                    }
                }
                else
                {
                    _context.UserContentInteractions.Add(new UserContentInteraction
                    {
                        ProfileId = profileId,
                        PostId = dto.PostId,
                        QAPostId = dto.QAPostId,
                        InteractionType = interactionType,
                        DwellTimeSeconds = dto.DwellTimeSeconds,
                        Source = source
                    });
                    shouldInvalidateProfile = true;
                }

                await _context.SaveChangesAsync();
                if (shouldInvalidateProfile)
                    await _cache.RemoveCacheAsync($"interest_profile:{profileId}");

                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while tracking interaction: {ex.Message}";
            }

            return result;
        }

        public async Task<ReturnResult<bool>> SubmitFeedbackAsync(CreateUserRecommendationFeedbackDTO dto)
        {
            var result = new ReturnResult<bool>();
            try
            {
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrWhiteSpace(profileId))
                {
                    result.Message = "Profile context is missing";
                    return result;
                }

                if (dto == null || (string.IsNullOrEmpty(dto.PostId) && string.IsNullOrEmpty(dto.QAPostId) && string.IsNullOrEmpty(dto.CommunityId)))
                {
                    result.Message = "PostId, QAPostId, or CommunityId is required";
                    return result;
                }

                var feedbackType = ParseFeedbackType(dto.FeedbackType);
                var existingFeedback = await _context.UserRecommendationFeedbacks
                    .FirstOrDefaultAsync(f =>
                        f.ProfileId == profileId &&
                        f.PostId == dto.PostId &&
                        f.QAPostId == dto.QAPostId &&
                        f.CommunityId == dto.CommunityId);

                if (existingFeedback != null)
                {
                    if (existingFeedback.FeedbackType != feedbackType)
                    {
                        existingFeedback.FeedbackType = feedbackType;
                    }
                }
                else
                {
                    _context.UserRecommendationFeedbacks.Add(new UserRecommendationFeedback
                    {
                        ProfileId = profileId,
                        PostId = dto.PostId,
                        QAPostId = dto.QAPostId,
                        CommunityId = dto.CommunityId,
                        FeedbackType = feedbackType
                    });
                }

                await _context.SaveChangesAsync();

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
