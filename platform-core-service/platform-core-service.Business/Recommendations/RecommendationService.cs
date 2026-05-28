using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Utils.Extensions;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Recommendations;
using platform_core_service.Common.Models.DTOs.EntityDTO.Community;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Common.Models.DTOs.EntityDTO.QAPost;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using PostEntity = platform_core_service.Common.Entities.DbEntities.Post;

namespace platform_core_service.Business.Recommendations
{
    public class RecommendationService : IRecommendationService
    {
        private const int CandidatePoolSize = 200;
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IUserInterestProfileService _profileService;
        private readonly IContentBasedScoringService _contentScoringService;
        private readonly ITrendingService _trendingService;
        private readonly ISemanticSimilarityService _semanticSimilarityService;

        public RecommendationService(
            ApplicationDbContext context,
            IMapper mapper,
            IUserInterestProfileService profileService,
            IContentBasedScoringService contentScoringService,
            ITrendingService trendingService,
            ISemanticSimilarityService semanticSimilarityService)
        {
            _context = context;
            _mapper = mapper;
            _profileService = profileService;
            _contentScoringService = contentScoringService;
            _trendingService = trendingService;
            _semanticSimilarityService = semanticSimilarityService;
        }

        public async Task<ReturnResult<PagedData<SelectPostDTO, string>>> GetPersonalizedPostFeedAsync(string userId, Page<string> page)
        {
            var result = new ReturnResult<PagedData<SelectPostDTO, string>>();
            try
            {
                NormalizePage(page);
                var profileId = await ResolveProfileIdAsync(userId);
                var excludedIds = await GetExcludedContentIdsAsync(userId, page.Selected, "post");

                var candidates = await _context.Posts
                    .Where(p => p.GetType() == typeof(PostEntity))
                    .ApplyPostVisibilityRules(_context, profileId)
                    .Where(p => !excludedIds.Contains(p.Id))
                    .Include(p => p.PostTags).ThenInclude(pt => pt.Tag)
                    .Include(p => p.Author)
                    .Include(p => p.Community)
                    .AsNoTracking()
                    .OrderByDescending(p => p.DateCreated)
                    .Take(CandidatePoolSize)
                    .ToListAsync();

                var profile = await _profileService.BuildAsync(userId);
                var trendingScores = await _trendingService.GetPostTrendingScoresAsync(candidates.Select(p => p.Id));

                var scored = candidates
                    .Select(post => new ScoredCandidate<PostEntity>(
                        post,
                        _contentScoringService.ScorePost(post, profile),
                        trendingScores.GetValueOrDefault(post.Id, 0)))
                    .ToList();

                await ApplySemanticScoresAsync(scored, userId, qaOnly: false);

                var ranked = scored
                    .OrderByDescending(x => x.FinalScore)
                    .Skip(page.PageNumber * page.Size)
                    .Take(page.Size)
                    .Select(x => _mapper.Map<SelectPostDTO>(x.Post))
                    .ToList();

                await HydratePostDtosAsync(ranked, profileId);

                page.TotalElements = candidates.Count;
                result.Result = new PagedData<SelectPostDTO, string>(page) { Data = ranked };
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while building personalized post feed: {ex.Message}";
            }

            return result;
        }

        public async Task<ReturnResult<PagedData<SelectQAPostDTO, string>>> GetPersonalizedQAPostFeedAsync(string userId, Page<string> page)
        {
            var result = new ReturnResult<PagedData<SelectQAPostDTO, string>>();
            try
            {
                NormalizePage(page);
                var profileId = await ResolveProfileIdAsync(userId);
                var excludedIds = await GetExcludedContentIdsAsync(userId, page.Selected, "qapost");

                var candidates = await _context.Posts
                    .OfType<QAPost>()
                    .ApplyQAPostVisibilityRules(_context, profileId)
                    .Where(p => !excludedIds.Contains(p.Id))
                    .Include(p => p.Answers)
                    .Include(p => p.PostTags).ThenInclude(pt => pt.Tag)
                    .Include(p => p.Author)
                    .Include(p => p.Community)
                    .AsNoTracking()
                    .OrderByDescending(p => p.DateCreated)
                    .Take(CandidatePoolSize)
                    .ToListAsync();

                var profile = await _profileService.BuildAsync(userId);
                var trendingScores = await _trendingService.GetQAPostTrendingScoresAsync(candidates.Select(p => p.Id));

                var scored = candidates
                    .Select(post => new ScoredCandidate<QAPost>(
                        post,
                        _contentScoringService.ScoreQAPost(post, profile),
                        trendingScores.GetValueOrDefault(post.Id, 0)))
                    .ToList();

                await ApplySemanticScoresAsync(scored, userId, qaOnly: true);

                var ranked = scored
                    .OrderByDescending(x => x.FinalScore)
                    .Skip(page.PageNumber * page.Size)
                    .Take(page.Size)
                    .Select(x => _mapper.Map<SelectQAPostDTO>(x.Post))
                    .ToList();

                await HydratePostDtosAsync(ranked.Cast<SelectPostDTO>().ToList(), profileId);

                page.TotalElements = candidates.Count;
                result.Result = new PagedData<SelectQAPostDTO, string>(page) { Data = ranked };
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while building personalized QA feed: {ex.Message}";
            }

            return result;
        }

        public async Task<ReturnResult<PagedData<SelectCommunityDTO, string>>> GetPersonalizedCommunityFeedAsync(string userId, Page<string> page)
        {
            var result = new ReturnResult<PagedData<SelectCommunityDTO, string>>();
            try
            {
                NormalizePage(page);
                var profileId = await ResolveProfileIdAsync(userId);
                var excludedIds = await GetExcludedCommunityIdsAsync(userId, profileId, page.Selected);

                var candidates = await _context.Communities
                    .Where(c => !c.Deleted)
                    .Where(c => !excludedIds.Contains(c.Id))
                    .Where(c => !_context.CommunityBans.Any(b => b.CommunityId == c.Id && b.BannedProfileId == profileId))
                    .Where(c => !_context.ProfileCommunityBlocks.Any(b => b.CommunityId == c.Id && b.ProfileId == profileId))
                    .Include(c => c.Members)
                    .Include(c => c.Posts.Where(p => !p.Deleted))
                        .ThenInclude(p => p.PostTags)
                    .AsNoTracking()
                    .Take(CandidatePoolSize)
                    .ToListAsync();

                var profile = await _profileService.BuildAsync(userId);
                var ranked = candidates
                    .Select(community => new
                    {
                        Community = community,
                        Score = _contentScoringService.ScoreCommunity(community, profile)
                    })
                    .OrderByDescending(x => x.Score)
                    .Skip(page.PageNumber * page.Size)
                    .Take(page.Size)
                    .Select(x =>
                    {
                        var dto = _mapper.Map<SelectCommunityDTO>(x.Community);
                        dto.MemberCount = x.Community.Members?.Count ?? 0;
                        dto.CurrentUserRole = "GUEST";
                        return dto;
                    })
                    .ToList();

                page.TotalElements = candidates.Count;
                result.Result = new PagedData<SelectCommunityDTO, string>(page) { Data = ranked };
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                result.Message = $"An error occurred while building personalized community feed: {ex.Message}";
            }

            return result;
        }

        private async Task<HashSet<string>> GetExcludedContentIdsAsync(string userId, List<string>? selectedIds, string contentType)
        {
            var cutoff = DateTimeOffset.UtcNow.AddDays(-7);
            var selected = selectedIds ?? new List<string>();

            var viewed = await _context.UserContentInteractions
                .Where(i => i.UserId == userId && i.InteractionType == "view" && i.DateCreated > cutoff)
                .Select(i => contentType == "post" ? i.PostId : i.QAPostId)
                .Where(id => id != null)
                .ToListAsync();

            var negativeFeedback = await _context.UserRecommendationFeedbacks
                .Where(f => f.UserId == userId)
                .Select(f => contentType == "post" ? f.PostId : f.QAPostId)
                .Where(id => id != null)
                .ToListAsync();

            return selected
                .Concat(viewed!)
                .Concat(negativeFeedback!)
                .Where(id => !string.IsNullOrEmpty(id))
                .ToHashSet()!;
        }

        private async Task<HashSet<string>> GetExcludedCommunityIdsAsync(string userId, string profileId, List<string>? selectedIds)
        {
            var memberIds = await _context.CommunityMembers
                .Where(m => m.ProfileId == profileId)
                .Select(m => m.CommunityId)
                .ToListAsync();

            var moderatedIds = await _context.CommunityModerators
                .Where(m => m.ModeratorId == profileId)
                .Select(m => m.CommunityId)
                .ToListAsync();

            var pendingIds = await _context.CommunityMembershipRequests
                .Where(r => r.RequesterId == profileId)
                .Select(r => r.CommunityId)
                .ToListAsync();

            var feedbackIds = await _context.UserRecommendationFeedbacks
                .Where(f => f.UserId == userId && f.CommunityId != null)
                .Select(f => f.CommunityId!)
                .ToListAsync();

            return (selectedIds ?? new List<string>())
                .Concat(memberIds)
                .Concat(moderatedIds)
                .Concat(pendingIds)
                .Concat(feedbackIds)
                .Where(id => !string.IsNullOrEmpty(id))
                .ToHashSet();
        }

        private async Task HydratePostDtosAsync(List<SelectPostDTO> posts, string profileId)
        {
            if (posts.Count == 0) return;

            var postIds = posts.Select(p => p.Id).ToList();
            var votes = await _context.Votes
                .Where(v => v.AuthorId == profileId && v.PostId != null && postIds.Contains(v.PostId))
                .Select(v => new { v.PostId, v.IsUpvote })
                .ToListAsync();

            var voteMap = votes
                .Where(v => v.PostId != null)
                .ToDictionary(v => v.PostId!, v => (bool?)v.IsUpvote);

            var savedItems = await _context.BookMarkedItems
                .Where(b => b.PostId != null && postIds.Contains(b.PostId) && b.BookMark.OwnerId == profileId)
                .Select(b => new { b.PostId, b.Id })
                .ToListAsync();

            var savedMap = savedItems
                .Where(b => b.PostId != null)
                .GroupBy(b => b.PostId!)
                .ToDictionary(g => g.Key, g => g.First().Id);

            var commentCounts = await _context.Comments
                .Where(c => c.PostId != null && postIds.Contains(c.PostId))
                .GroupBy(c => c.PostId!)
                .Select(g => new { PostId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.PostId, x => x.Count);

            foreach (var post in posts)
            {
                post.CurrentUserVote = voteMap.GetValueOrDefault(post.Id);
                post.IsSaved = savedMap.ContainsKey(post.Id);
                post.SavedBookMarkedItemId = savedMap.GetValueOrDefault(post.Id);
                post.CommentCount = commentCounts.GetValueOrDefault(post.Id, 0);
            }
        }

        private async Task ApplySemanticScoresAsync<T>(List<ScoredCandidate<T>> scored, string userId, bool qaOnly)
            where T : PostEntity
        {
            var semanticCandidates = scored
                .OrderByDescending(s => s.ContentBasedScore + s.TrendingScore)
                .Take(25)
                .Where(s => s.ContentBasedScore > 0)
                .ToList();

            foreach (var candidate in semanticCandidates)
            {
                candidate.SemanticScore = await _semanticSimilarityService.ScorePostAsync(candidate.Post, userId, qaOnly);
            }
        }

        private async Task<string> ResolveProfileIdAsync(string userId)
        {
            var profileId = await _context.Profiles
                .Where(p => p.ApplicationUserId == userId)
                .Select(p => p.Id)
                .FirstOrDefaultAsync();

            return profileId ?? userId;
        }

        private static void NormalizePage(Page<string> page)
        {
            page.Size = page.Size <= 0 ? 20 : Math.Min(page.Size, 50);
            page.PageNumber = Math.Max(page.PageNumber, 0);
            page.Selected ??= new List<string>();
        }

        private sealed class ScoredCandidate<T>
            where T : PostEntity
        {
            public ScoredCandidate(T post, double contentBasedScore, double trendingScore)
            {
                Post = post;
                ContentBasedScore = contentBasedScore;
                TrendingScore = trendingScore;
            }

            public T Post { get; }
            public double ContentBasedScore { get; }
            public double TrendingScore { get; }
            public double SemanticScore { get; set; }
            public double FinalScore => (ContentBasedScore * 0.45) + (SemanticScore * 0.35) + (TrendingScore * 0.20);
        }
    }
}
