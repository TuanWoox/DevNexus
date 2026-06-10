using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Utils.Extensions;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Recommendations;
using platform_core_service.Common.Models.DTOs.EntityDTO.Community;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;

namespace platform_core_service.Business.Recommendations
{
    public class TrendingService : ITrendingService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IUserContext _userContext;

        public TrendingService(
            ApplicationDbContext context,
            IMapper mapper,
            IUserContext userContext)
        {
            _context = context;
            _mapper = mapper;
            _userContext = userContext;
        }

        public async Task<Dictionary<string, double>> GetPostTrendingScoresAsync(IEnumerable<string> postIds)
        {
            var ids = postIds.Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();
            if (ids.Count == 0) return new Dictionary<string, double>();

            var recentCutoff = DateTimeOffset.UtcNow.AddDays(-7);
            var posts = await _context.Posts
                .Where(p => ids.Contains(p.Id))
                .Select(p => new { p.Id, p.UpvoteCount, p.DownvoteCount, p.DateCreated })
                .ToListAsync();

            var commentCounts = await _context.Comments
                .Where(c => c.PostId != null &&
                            ids.Contains(c.PostId) &&
                            !c.Deleted &&
                            c.ModerationStatus != ModerationStatus.Flagged)
                .GroupBy(c => c.PostId!)
                .Select(g => new { Id = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Id, x => x.Count);

            var interactionCounts = await _context.UserContentInteractions
                .Where(i => i.PostId != null && ids.Contains(i.PostId) && i.DateCreated > recentCutoff)
                .GroupBy(i => i.PostId!)
                .Select(g => new { Id = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Id, x => x.Count);

            return posts.ToDictionary(
                p => p.Id,
                p => CalculateTrendingScore(
                    p.UpvoteCount,
                    p.DownvoteCount,
                    commentCounts.GetValueOrDefault(p.Id, 0),
                    interactionCounts.GetValueOrDefault(p.Id, 0),
                    p.DateCreated));
        }

        public async Task<Dictionary<string, double>> GetQAPostTrendingScoresAsync(IEnumerable<string> qaPostIds)
        {
            var ids = qaPostIds.Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();
            if (ids.Count == 0) return new Dictionary<string, double>();

            var scores = await GetPostTrendingScoresAsync(ids);
            var answerCounts = await _context.Answers
                .Where(a => ids.Contains(a.QAPostId) &&
                            !a.Deleted &&
                            a.ModerationStatus != ModerationStatus.Flagged)
                .GroupBy(a => a.QAPostId)
                .Select(g => new { Id = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Id, x => x.Count);

            foreach (var item in answerCounts)
            {
                scores[item.Key] = scores.GetValueOrDefault(item.Key, 0) + item.Value * 1.5;
            }

            return scores;
        }

        public async Task<ReturnResult<List<SelectPostDTO>>> GetTrendingPostsAsync(string period, int limit)
        {
            var result = new ReturnResult<List<SelectPostDTO>>();
            try
            {
                limit = Math.Clamp(limit, 1, 50);
                var cutoff = GetPeriodCutoff(period);
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrWhiteSpace(profileId))
                    return result;

                var baseQuery = _context.Posts
                    .Where(p => p.GetType() == typeof(Post))
                    .ApplyPostVisibilityRules(_context, profileId);

                var candidates = await baseQuery
                    .Where(p => p.DateCreated > cutoff)
                    .Include(p => p.PostTags).ThenInclude(pt => pt.Tag)
                    .Include(p => p.Author)
                    .Include(p => p.Community)
                    .AsNoTracking()
                    .OrderByDescending(p => p.DateCreated)
                    .Take(200)
                    .ToListAsync();

                if (candidates.Count < limit)
                {
                    var existingIds = candidates.Select(p => p.Id).ToHashSet();
                    var fallbackCandidates = await baseQuery
                        .Where(p => !existingIds.Contains(p.Id))
                        .Include(p => p.PostTags).ThenInclude(pt => pt.Tag)
                        .Include(p => p.Author)
                        .Include(p => p.Community)
                        .AsNoTracking()
                        .OrderByDescending(p => p.DateCreated)
                        .Take(200 - candidates.Count)
                        .ToListAsync();

                    candidates.AddRange(fallbackCandidates);
                }

                var scores = await GetPostTrendingScoresAsync(candidates.Select(p => p.Id));
                result.Result = candidates
                    .OrderByDescending(p => scores.GetValueOrDefault(p.Id, 0))
                    .ThenByDescending(p => p.DateCreated)
                    .Take(limit)
                    .Select(p => _mapper.Map<SelectPostDTO>(p))
                    .ToList();
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while retrieving trending posts: {ex.Message}";
            }

            return result;
        }

        public async Task<ReturnResult<List<SelectCommunityDTO>>> GetTrendingCommunitiesAsync(string period, int limit)
        {
            var result = new ReturnResult<List<SelectCommunityDTO>>();
            try
            {
                limit = Math.Clamp(limit, 1, 50);
                var cutoff = GetPeriodCutoff(period);
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrWhiteSpace(profileId))
                    return result;

                var communities = await _context.Communities
                    .ApplyCommunityVisibilityRules(_context, profileId)
                    .Include(c => c.Members)
                    .Include(c => c.Posts.Where(p => !p.Deleted && p.DateCreated > cutoff))
                    .AsNoTracking()
                    .Take(200)
                    .ToListAsync();

                result.Result = communities
                    .OrderByDescending(c => (c.Posts?.Count ?? 0) * 3 + (c.Members?.Count ?? 0))
                    .Take(limit)
                    .Select(c =>
                    {
                        var dto = _mapper.Map<SelectCommunityDTO>(c);
                        dto.MemberCount = c.Members?.Count ?? 0;
                        return dto;
                    })
                    .ToList();
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while retrieving trending communities: {ex.Message}";
            }

            return result;
        }

        private static double CalculateTrendingScore(
            int upvotes,
            int downvotes,
            int comments,
            int interactions,
            DateTimeOffset? createdAt)
        {
            var ageHours = Math.Max(1, (DateTimeOffset.UtcNow - (createdAt ?? DateTimeOffset.UtcNow)).TotalHours);
            var rawScore = upvotes * 3 - downvotes * 2 + comments * 2 + interactions;
            return rawScore / Math.Pow(ageHours + 2, 0.35);
        }

        private static DateTimeOffset GetPeriodCutoff(string? period)
        {
            return (period ?? "7d").Trim().ToLowerInvariant() switch
            {
                "24h" or "1d" => DateTimeOffset.UtcNow.AddDays(-1),
                "30d" => DateTimeOffset.UtcNow.AddDays(-30),
                "90d" => DateTimeOffset.UtcNow.AddDays(-90),
                _ => DateTimeOffset.UtcNow.AddDays(-7)
            };
        }
    }
}
