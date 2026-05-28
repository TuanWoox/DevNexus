using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using platform_core_service.Common.Interfaces.Recommendations;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.RecommendationDTO;
using platform_core_service.Data;

namespace platform_core_service.Business.Recommendations
{
    public class UserInterestProfileService : IUserInterestProfileService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICacheService _cache;

        // Signal weights
        private const double WEIGHT_UPVOTE_POST = 3.0;
        private const double WEIGHT_BOOKMARK = 2.5;
        private const double WEIGHT_UPVOTE_ANSWER = 2.5;
        private const double WEIGHT_COMMENT = 2.0;
        private const double WEIGHT_UPVOTE_COMMENT = 1.5;
        private const double WEIGHT_VIEW_LONG = 1.5;
        private const double WEIGHT_VIEW = 0.5;
        private const double WEIGHT_DOWNVOTE = -2.0;
        private const double WEIGHT_NEGATIVE_FEEDBACK = -5.0;

        public UserInterestProfileService(ApplicationDbContext context, ICacheService cache)
        {
            _context = context;
            _cache = cache;
        }

        public async Task<UserInterestProfile> BuildAsync(string userId)
        {
            var cacheKey = $"interest_profile:{userId}";
            var userInterestProfile = await _cache.GetCacheAsync<UserInterestProfile>(cacheKey);
            if (userInterestProfile != null)
                return userInterestProfile;

            var profileId = await ResolveProfileIdAsync(userId);
            var profile = new UserInterestProfile { UserId = userId };

            var upvotedPostTags = await _context.Votes
                .AsNoTracking()
                .Where(v => v.AuthorId == profileId && v.IsUpvote && v.PostId != null)
                .Join(_context.PostTags, v => v.PostId, pt => pt.PostId, (v, pt) => pt.TagId)
                .ToListAsync();
            AddWeights(profile.TagWeights, upvotedPostTags, WEIGHT_UPVOTE_POST);

            var downvotedPostTags = await _context.Votes
                .AsNoTracking()
                .Where(v => v.AuthorId == profileId && !v.IsUpvote && v.PostId != null)
                .Join(_context.PostTags, v => v.PostId, pt => pt.PostId, (v, pt) => pt.TagId)
                .ToListAsync();
            AddWeights(profile.TagWeights, downvotedPostTags, WEIGHT_DOWNVOTE);

            var bookmarkedPostTags = await _context.BookMarkedItems
                .AsNoTracking()
                .Where(b => b.BookMark.OwnerId == profileId && b.PostId != null)
                .Join(_context.PostTags, b => b.PostId, pt => pt.PostId, (b, pt) => pt.TagId)
                .ToListAsync();
            AddWeights(profile.TagWeights, bookmarkedPostTags, WEIGHT_BOOKMARK);

            var upvotedAnswerTags = await _context.Votes
                .AsNoTracking()
                .Where(v => v.AuthorId == profileId && v.IsUpvote && v.AnswerId != null)
                .Join(_context.Answers, v => v.AnswerId, a => a.Id, (v, a) => a.QAPostId)
                .Join(_context.PostTags, qaPostId => qaPostId, pt => pt.PostId, (qaPostId, pt) => pt.TagId)
                .ToListAsync();
            AddWeights(profile.TagWeights, upvotedAnswerTags, WEIGHT_UPVOTE_ANSWER);

            var commentedPostTags = await _context.Comments
                .AsNoTracking()
                .Where(c => c.AuthorId == profileId && c.PostId != null)
                .Join(_context.PostTags, c => c.PostId, pt => pt.PostId, (c, pt) => pt.TagId)
                .ToListAsync();
            AddWeights(profile.TagWeights, commentedPostTags, WEIGHT_COMMENT);

            var commentedAnswerTags = await _context.Comments
                .AsNoTracking()
                .Where(c => c.AuthorId == profileId && c.AnswerId != null)
                .Join(_context.Answers, c => c.AnswerId, a => a.Id, (c, a) => a.QAPostId)
                .Join(_context.PostTags, qaPostId => qaPostId, pt => pt.PostId, (qaPostId, pt) => pt.TagId)
                .ToListAsync();
            AddWeights(profile.TagWeights, commentedAnswerTags, WEIGHT_COMMENT);

            var upvotedPostCommentTags = await _context.Votes
                .AsNoTracking()
                .Where(v => v.AuthorId == profileId && v.IsUpvote && v.CommentId != null)
                .Join(_context.Comments, v => v.CommentId, c => c.Id, (v, c) => c.PostId)
                .Where(postId => postId != null)
                .Join(_context.PostTags, postId => postId, pt => pt.PostId, (postId, pt) => pt.TagId)
                .ToListAsync();
            AddWeights(profile.TagWeights, upvotedPostCommentTags, WEIGHT_UPVOTE_COMMENT);

            var upvotedAnswerCommentTags = await _context.Votes
                .AsNoTracking()
                .Where(v => v.AuthorId == profileId && v.IsUpvote && v.CommentId != null)
                .Join(_context.Comments, v => v.CommentId, c => c.Id, (v, c) => c.AnswerId)
                .Where(answerId => answerId != null)
                .Join(_context.Answers, answerId => answerId, a => a.Id, (answerId, a) => a.QAPostId)
                .Join(_context.PostTags, qaPostId => qaPostId, pt => pt.PostId, (qaPostId, pt) => pt.TagId)
                .ToListAsync();
            AddWeights(profile.TagWeights, upvotedAnswerCommentTags, WEIGHT_UPVOTE_COMMENT);

            var recentInteractionCutoff = DateTimeOffset.UtcNow.AddDays(-30);
            var viewedPostTags = await _context.UserContentInteractions
                .AsNoTracking()
                .Where(i => i.UserId == userId && i.PostId != null)
                .Where(i => i.DateCreated > recentInteractionCutoff)
                .Join(_context.PostTags,
                    i => i.PostId,
                    pt => pt.PostId,
                    (i, pt) => new WeightedTag(
                        pt.TagId,
                        (i.DwellTimeSeconds ?? 0) > 30 ? WEIGHT_VIEW_LONG : WEIGHT_VIEW))
                .ToListAsync();
            AddWeightedTags(profile.TagWeights, viewedPostTags);

            var viewedQaPostTags = await _context.UserContentInteractions
                .AsNoTracking()
                .Where(i => i.UserId == userId && i.QAPostId != null)
                .Where(i => i.DateCreated > recentInteractionCutoff)
                .Join(_context.PostTags,
                    i => i.QAPostId,
                    pt => pt.PostId,
                    (i, pt) => new WeightedTag(
                        pt.TagId,
                        (i.DwellTimeSeconds ?? 0) > 30 ? WEIGHT_VIEW_LONG : WEIGHT_VIEW))
                .ToListAsync();
            AddWeightedTags(profile.TagWeights, viewedQaPostTags);

            var feedbackPostTags = await _context.UserRecommendationFeedbacks
                .AsNoTracking()
                .Where(f => f.UserId == userId && f.PostId != null)
                .Join(_context.PostTags, f => f.PostId, pt => pt.PostId, (f, pt) => pt.TagId)
                .ToListAsync();
            AddWeights(profile.TagWeights, feedbackPostTags, WEIGHT_NEGATIVE_FEEDBACK);

            var feedbackQaPostTags = await _context.UserRecommendationFeedbacks
                .AsNoTracking()
                .Where(f => f.UserId == userId && f.QAPostId != null)
                .Join(_context.PostTags, f => f.QAPostId, pt => pt.PostId, (f, pt) => pt.TagId)
                .ToListAsync();
            AddWeights(profile.TagWeights, feedbackQaPostTags, WEIGHT_NEGATIVE_FEEDBACK);

            profile.FollowedAuthorIds = await _context.UserFollows
                .AsNoTracking()
                .Where(f => f.OwnerId == profileId)
                .Select(f => f.FollowingProfileId)
                .ToHashSetAsync();

            profile.CommunityIds = await _context.CommunityMembers
                .AsNoTracking()
                .Where(cm => cm.ProfileId == profileId)
                .Select(cm => cm.CommunityId)
                .ToHashSetAsync();

            await _cache.SetCacheAsync(cacheKey, profile, new DistributedCacheEntryOptions
            {
                SlidingExpiration = TimeSpan.FromHours(1)
            });

            return profile;
        }

        private async Task<string> ResolveProfileIdAsync(string userId)
        {
            var profileId = await _context.Profiles
                .AsNoTracking()
                .Where(p => p.ApplicationUserId == userId)
                .Select(p => p.Id)
                .FirstOrDefaultAsync();

            return profileId ?? userId;
        }

        private static void AddWeights(Dictionary<string, double> weights, IEnumerable<string> tagIds, double weight)
        {
            foreach (var tagId in tagIds)
            {
                AddWeight(weights, tagId, weight);
            }
        }

        private static void AddWeightedTags(
            Dictionary<string, double> weights,
            IEnumerable<WeightedTag> weightedTags)
        {
            foreach (var tag in weightedTags)
            {
                AddWeight(weights, tag.TagId, tag.Weight);
            }
        }

        private static void AddWeight(Dictionary<string, double> weights, string? tagId, double weight)
        {
            if (string.IsNullOrEmpty(tagId)) return;

            weights[tagId] = weights.GetValueOrDefault(tagId, 0) + weight;
        }

        private sealed record WeightedTag(string TagId, double Weight);
    }
}
