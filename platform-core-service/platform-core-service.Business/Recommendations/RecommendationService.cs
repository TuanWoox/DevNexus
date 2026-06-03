using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Utils.Extensions;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Contexts;
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
        private const double RecentViewPenalty = 2.0;
        private const double RecentDwellPenalty = 5.0;
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IUserInterestProfileService _profileService;
        private readonly IContentBasedScoringService _contentScoringService;
        private readonly ITrendingService _trendingService;
        private readonly ISemanticSimilarityService _semanticSimilarityService;
        private readonly IUserContext _userContext;

        public RecommendationService(
            ApplicationDbContext context,
            IMapper mapper,
            IUserInterestProfileService profileService,
            IContentBasedScoringService contentScoringService,
            ITrendingService trendingService,
            ISemanticSimilarityService semanticSimilarityService,
            IUserContext userContext

        )
        {
            _context = context;
            _mapper = mapper;
            _profileService = profileService;
            _contentScoringService = contentScoringService;
            _trendingService = trendingService;
            _semanticSimilarityService = semanticSimilarityService;
            _userContext = userContext;
        }

        public async Task<ReturnResult<PagedData<SelectPostDTO, string>>> GetPersonalizedPostFeedAsync(Page<string> page)
        {
            var result = new ReturnResult<PagedData<SelectPostDTO, string>>();
            try
            {
                NormalizePage(page);
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrWhiteSpace(profileId))
                    return EmptyPagedResult<SelectPostDTO>(result, page, "Profile context is missing.");

                var excludedIds = await GetExcludedContentIdsAsync(profileId, page.Selected, "post");

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

                var profile = await _profileService.BuildAsync();
                var trendingScores = await _trendingService.GetPostTrendingScoresAsync(candidates.Select(p => p.Id));
                var seenPenalties = await GetRecentSeenPostPenaltiesAsync(profileId, candidates.Select(p => p.Id));

                var scored = candidates
                    .Select(post => new ScoredCandidate<PostEntity>(
                        post,
                        _contentScoringService.ScorePost(post, profile),
                        trendingScores.GetValueOrDefault(post.Id, 0),
                        seenPenalties.GetValueOrDefault(post.Id, 0)))
                    .ToList();

                await ApplySemanticScoresAsync(scored, profileId, qaOnly: false);

                var ranked = scored
                    .OrderByDescending(x => x.FinalScore)
                    .ThenBy(x => x.SeenPenalty > 0)
                    .ThenByDescending(x => x.Post.DateCreated)
                    .Skip(GetSkip(page))
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

        public async Task<ReturnResult<PagedData<SelectQAPostDTO, string>>> GetPersonalizedQAPostFeedAsync(Page<string> page)
        {
            var result = new ReturnResult<PagedData<SelectQAPostDTO, string>>();
            try
            {
                NormalizePage(page);
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrWhiteSpace(profileId))
                    return EmptyPagedResult<SelectQAPostDTO>(result, page, "Profile context is missing.");

                var excludedIds = await GetExcludedContentIdsAsync(profileId, page.Selected, "qapost");

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

                var profile = await _profileService.BuildAsync();
                var trendingScores = await _trendingService.GetQAPostTrendingScoresAsync(candidates.Select(p => p.Id));
                var seenPenalties = await GetRecentSeenQAPostPenaltiesAsync(profileId, candidates.Select(p => p.Id));

                var scored = candidates
                    .Select(post => new ScoredCandidate<QAPost>(
                        post,
                        _contentScoringService.ScoreQAPost(post, profile),
                        trendingScores.GetValueOrDefault(post.Id, 0),
                        seenPenalties.GetValueOrDefault(post.Id, 0)))
                    .ToList();

                await ApplySemanticScoresAsync(scored, profileId, qaOnly: true);

                var ranked = scored
                    .OrderByDescending(x => x.FinalScore)
                    .ThenBy(x => x.SeenPenalty > 0)
                    .ThenByDescending(x => x.Post.DateCreated)
                    .Skip(GetSkip(page))
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

        public async Task<ReturnResult<PagedData<SelectCommunityDTO, string>>> GetPersonalizedCommunityFeedAsync(Page<string> page)
        {
            var result = new ReturnResult<PagedData<SelectCommunityDTO, string>>();
            try
            {
                NormalizePage(page);
                var profileId = _userContext.ProfileId;
                if (string.IsNullOrWhiteSpace(profileId))
                    return EmptyPagedResult<SelectCommunityDTO>(result, page, "Profile context is missing.");

                var excludedIds = await GetExcludedCommunityIdsAsync(profileId, page.Selected);

                var query = _context.Communities
                    .Where(c => !c.Deleted)
                    .Where(c => !excludedIds.Contains(c.Id))
                    .Where(c => !_context.CommunityBans.Any(b => b.CommunityId == c.Id && b.BannedProfileId == profileId))
                    .Where(c => !_context.ProfileCommunityBlocks.Any(b => b.CommunityId == c.Id && b.ProfileId == profileId));

                var candidates = await query
                    .Include(c => c.Members)
                    .Include(c => c.Posts.Where(p => !p.Deleted))
                        .ThenInclude(p => p.PostTags)
                    .AsNoTracking()
                    .Take(CandidatePoolSize)
                    .ToListAsync();

                var profile = await _profileService.BuildAsync();
                var ranked = candidates
                    .Select(community => new
                    {
                        Community = community,
                        Score = _contentScoringService.ScoreCommunity(community, profile)
                    })
                    .OrderByDescending(x => x.Score)
                    .ThenByDescending(x => x.Community.DateCreated)
                    .Skip(GetSkip(page))
                    .Take(page.Size)
                    .Select(x =>
                    {
                        var dto = _mapper.Map<SelectCommunityDTO>(x.Community);
                        return dto;
                    })
                    .ToList();

                await HydrateCommunityDtosAsync(ranked, profileId);

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

        private async Task<HashSet<string>> GetExcludedContentIdsAsync(string profileId, List<string>? selectedIds, string contentType)
        {
            var selected = selectedIds ?? new List<string>();

            var negativeFeedback = await _context.UserRecommendationFeedbacks
                .Where(f => f.ProfileId == profileId)
                .Select(f => contentType == "post" ? f.PostId : f.QAPostId)
                .Where(id => id != null)
                .ToListAsync();

            return selected.Concat(negativeFeedback!)
                            .Where(id => !string.IsNullOrEmpty(id))
                            .ToHashSet()!;
        }

        private async Task<HashSet<string>> GetExcludedCommunityIdsAsync(string profileId, List<string>? selectedIds)
        {
            var feedbackIds = await _context.UserRecommendationFeedbacks
                .Where(f => f.ProfileId == profileId && f.CommunityId != null)
                .Select(f => f.CommunityId!)
                .ToListAsync();

            return (selectedIds ?? new List<string>())
                .Concat(feedbackIds)
                .Where(id => !string.IsNullOrEmpty(id))
                .ToHashSet();
        }

        private async Task<Dictionary<string, double>> GetRecentSeenPostPenaltiesAsync(string profileId, IEnumerable<string> postIds)
        {
            var ids = postIds.Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();
            if (ids.Count == 0)
                return new Dictionary<string, double>();

            var cutoff = DateTimeOffset.UtcNow.AddDays(-14);
            var interactions = await _context.UserContentInteractions
                .AsNoTracking()
                .Where(i => i.ProfileId == profileId && i.PostId != null && ids.Contains(i.PostId))
                .Where(i => i.DateCreated > cutoff)
                .Select(i => new
                {
                    ContentId = i.PostId!,
                    i.InteractionType,
                    i.DwellTimeSeconds
                })
                .ToListAsync();

            return interactions
                .GroupBy(i => i.ContentId)
                .ToDictionary(
                    group => group.Key,
                    group => group.Max(i => GetSeenPenalty(i.InteractionType, i.DwellTimeSeconds)));
        }

        private async Task<Dictionary<string, double>> GetRecentSeenQAPostPenaltiesAsync(string profileId, IEnumerable<string> qaPostIds)
        {
            var ids = qaPostIds.Where(id => !string.IsNullOrEmpty(id)).Distinct().ToList();
            if (ids.Count == 0)
                return new Dictionary<string, double>();

            var cutoff = DateTimeOffset.UtcNow.AddDays(-14);
            var interactions = await _context.UserContentInteractions
                .AsNoTracking()
                .Where(i => i.ProfileId == profileId && i.QAPostId != null && ids.Contains(i.QAPostId))
                .Where(i => i.DateCreated > cutoff)
                .Select(i => new
                {
                    ContentId = i.QAPostId!,
                    i.InteractionType,
                    i.DwellTimeSeconds
                })
                .ToListAsync();

            return interactions
                .GroupBy(i => i.ContentId)
                .ToDictionary(
                    group => group.Key,
                    group => group.Max(i => GetSeenPenalty(i.InteractionType, i.DwellTimeSeconds)));
        }

        private static double GetSeenPenalty(string interactionType, int? dwellTimeSeconds)
        {
            if (interactionType == "dwell" || (dwellTimeSeconds ?? 0) > 30)
                return RecentDwellPenalty;

            return RecentViewPenalty;
        }

        private async Task HydrateCommunityDtosAsync(List<SelectCommunityDTO> communities, string profileId)
        {
            if (communities.Count == 0) return;

            var communityIds = communities.Select(c => c.Id).ToList();

            var memberCounts = await _context.CommunityMembers
                .Where(m => communityIds.Contains(m.CommunityId))
                .GroupBy(m => m.CommunityId)
                .Select(group => new { CommunityId = group.Key, Count = group.Count() })
                .ToDictionaryAsync(group => group.CommunityId, group => group.Count);

            var ownedIds = await _context.Communities
                .Where(c => communityIds.Contains(c.Id) && c.OwnerId == profileId)
                .Select(c => c.Id)
                .ToListAsync();

            var moderatorIds = await _context.CommunityModerators
                .Where(m => communityIds.Contains(m.CommunityId) && m.ModeratorId == profileId)
                .Select(m => m.CommunityId)
                .ToListAsync();

            var memberIds = await _context.CommunityMembers
                .Where(m => communityIds.Contains(m.CommunityId) && m.ProfileId == profileId)
                .Select(m => m.CommunityId)
                .ToListAsync();

            var pendingIds = await _context.CommunityMembershipRequests
                .Where(r => communityIds.Contains(r.CommunityId) && r.RequesterId == profileId)
                .Select(r => r.CommunityId)
                .ToListAsync();

            var ownedSet = new HashSet<string>(ownedIds);
            var moderatorSet = new HashSet<string>(moderatorIds);
            var memberSet = new HashSet<string>(memberIds);
            var pendingSet = new HashSet<string>(pendingIds);

            foreach (var dto in communities)
            {
                dto.MemberCount = memberCounts.GetValueOrDefault(dto.Id, 0);

                if (ownedSet.Contains(dto.Id))
                    dto.CurrentUserRole = "OWNER";
                else if (moderatorSet.Contains(dto.Id))
                    dto.CurrentUserRole = "MODERATOR";
                else if (memberSet.Contains(dto.Id))
                    dto.CurrentUserRole = "MEMBER";
                else if (pendingSet.Contains(dto.Id))
                    dto.CurrentUserRole = "PENDING";
                else
                    dto.CurrentUserRole = "GUEST";
            }
        }

        private async Task HydratePostDtosAsync(List<SelectPostDTO> posts, string profileId)
        {
            if (posts.Count == 0) return;

            var postIds = posts.Select(p => p.Id).ToList();

            await posts.HydrateSharedPostsAsync(_context, profileId);

            var votes = await _context.Votes
                .Where(v => v.AuthorId == profileId && v.PostId != null && postIds.Contains(v.PostId))
                .Select(v => new { v.PostId, v.IsUpvote })
                .ToListAsync();

            var voteMap = votes
                .Where(v => v.PostId != null)
                .ToDictionary(v => v.PostId!, v => (bool?)v.IsUpvote);

            var savedItems = await _context.BookMarkedItems
                .Where(b => b.BookMark.OwnerId == profileId &&
                            ((b.PostId != null && postIds.Contains(b.PostId)) ||
                             (b.QAPostId != null && postIds.Contains(b.QAPostId))))
                .Select(b => new { b.PostId, b.QAPostId, b.Id })
                .ToListAsync();

            var savedMap = savedItems
                .Select(b => new { ContentId = b.PostId ?? b.QAPostId, b.Id })
                .Where(b => b.ContentId != null)
                .GroupBy(b => b.ContentId!)
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

        private async Task ApplySemanticScoresAsync<T>(List<ScoredCandidate<T>> scored, string profileId, bool qaOnly)
            where T : PostEntity
        {
            if (scored.Count == 0)
                return;

            var semanticCandidates = scored
                .OrderByDescending(s => s.ContentBasedScore + s.TrendingScore)
                .Take(25)
                .ToList();

            var semanticScores = await _semanticSimilarityService.ScorePostsAsync(
                semanticCandidates.Select(candidate => candidate.Post).Cast<PostEntity>().ToList(),
                profileId,
                qaOnly);

            foreach (var candidate in semanticCandidates)
                candidate.SemanticScore = semanticScores.GetValueOrDefault(candidate.Post.Id, 0);
        }

        private static void NormalizePage(Page<string> page)
        {
            page.Size = page.Size <= 0 ? 20 : Math.Min(page.Size, 50);
            page.PageNumber = Math.Max(page.PageNumber, 0);
            page.Selected ??= new List<string>();
        }

        private static int GetSkip(Page<string> page)
        {
            return Math.Max(page.PageNumber, 0) * page.Size;
        }

        private static ReturnResult<PagedData<TDto, string>> EmptyPagedResult<TDto>(
            ReturnResult<PagedData<TDto, string>> result,
            Page<string> page,
            string message)
        {
            page.TotalElements = 0;
            result.Message = message;
            result.Result = new PagedData<TDto, string>(page) { Data = new List<TDto>() };
            return result;
        }

        private sealed class ScoredCandidate<T>
            where T : PostEntity
        {
            public ScoredCandidate(T post, double contentBasedScore, double trendingScore, double seenPenalty)
            {
                Post = post;
                ContentBasedScore = contentBasedScore;
                TrendingScore = trendingScore;
                SeenPenalty = seenPenalty;
            }

            public T Post { get; }
            public double ContentBasedScore { get; }
            public double TrendingScore { get; }
            public double SeenPenalty { get; }
            public double SemanticScore { get; set; }
            public double FinalScore => (ContentBasedScore * 0.45) + (SemanticScore * 0.35) + (TrendingScore * 0.20) - SeenPenalty;
        }
    }
}
