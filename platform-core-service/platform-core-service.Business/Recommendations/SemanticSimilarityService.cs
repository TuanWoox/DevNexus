using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Recommendations;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.AIDTO;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;

namespace platform_core_service.Business.Recommendations
{
    public class SemanticSimilarityService : ISemanticSimilarityService
    {
        private const int ReferenceContentCount = 3;
        private readonly ApplicationDbContext _context;
        private readonly IAiWorkerClient _aiWorkerClient;
        private readonly ICacheService _cache;

        public SemanticSimilarityService(
            ApplicationDbContext context,
            IAiWorkerClient aiWorkerClient,
            ICacheService cache)
        {
            _context = context;
            _aiWorkerClient = aiWorkerClient;
            _cache = cache;
        }

        public async Task<double> ScorePostAsync(Post candidate, string userId, bool qaOnly = false)
        {
            try
            {
                var referenceIds = await GetReferenceContentIdsAsync(userId, qaOnly);
                if (referenceIds.Count == 0)
                    return 0;

                var candidateEmbedding = await GetEmbeddingAsync(candidate.Id, BuildContentText(candidate));
                if (candidateEmbedding.Count == 0)
                    return 0;

                var referencePosts = await _context.Posts
                    .Where(p => referenceIds.Contains(p.Id))
                    .Include(p => p.PostTags).ThenInclude(pt => pt.Tag)
                    .AsNoTracking()
                    .ToListAsync();

                var bestScore = 0.0;
                foreach (var reference in referencePosts)
                {
                    var referenceEmbedding = await GetEmbeddingAsync(reference.Id, BuildContentText(reference));
                    if (referenceEmbedding.Count == 0)
                        continue;

                    bestScore = Math.Max(bestScore, CosineSimilarity(candidateEmbedding, referenceEmbedding));
                }

                return Math.Clamp(bestScore * 5.0, 0, 5.0);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Warn($"[SemanticSimilarityService] Falling back without AI semantic score: {ex.Message}");
                return 0;
            }
        }

        private async Task<List<string>> GetReferenceContentIdsAsync(string userId, bool qaOnly)
        {
            var cutoff = DateTimeOffset.UtcNow.AddDays(-30);
            var query = _context.UserContentInteractions
                .Where(i => i.UserId == userId && i.DateCreated > cutoff);

            var referenceIds = qaOnly
                ? await query
                    .Where(i => i.QAPostId != null)
                    .GroupBy(i => i.QAPostId!)
                    .OrderByDescending(g => g.Count())
                    .Select(g => g.Key)
                    .Take(ReferenceContentCount)
                    .ToListAsync()
                : await query
                    .Where(i => i.PostId != null)
                    .GroupBy(i => i.PostId!)
                    .OrderByDescending(g => g.Count())
                    .Select(g => g.Key)
                    .Take(ReferenceContentCount)
                    .ToListAsync();

            return referenceIds;
        }

        private async Task<List<float>> GetEmbeddingAsync(string contentId, string text)
        {
            var cacheKey = $"recommendation_embedding:{contentId}";
            var cached = await _cache.GetCacheAsync<List<float>>(cacheKey);
            if (cached is { Count: > 0 })
                return cached;

            var result = await _aiWorkerClient.GetRecommendationEmbeddingAsync(new AIEmbeddingRequestDTO
            {
                Text = text
            });

            if (result.Result?.Embedding == null || result.Result.Embedding.Count == 0)
                return [];

            await _cache.SetCacheAsync(cacheKey, result.Result.Embedding, new DistributedCacheEntryOptions
            {
                SlidingExpiration = TimeSpan.FromDays(7)
            });

            return result.Result.Embedding;
        }

        private static string BuildContentText(Post post)
        {
            var tags = post.PostTags?.Select(pt => pt.Tag?.Name).Where(name => !string.IsNullOrWhiteSpace(name)) ?? [];
            return string.Join(
                Environment.NewLine,
                post.Title,
                string.Join(", ", tags),
                post.Content);
        }

        private static double CosineSimilarity(IReadOnlyList<float> a, IReadOnlyList<float> b)
        {
            if (a.Count == 0 || b.Count == 0 || a.Count != b.Count)
                return 0;

            double dot = 0;
            double normA = 0;
            double normB = 0;

            for (var i = 0; i < a.Count; i++)
            {
                dot += a[i] * b[i];
                normA += a[i] * a[i];
                normB += b[i] * b[i];
            }

            if (normA == 0 || normB == 0)
                return 0;

            return dot / (Math.Sqrt(normA) * Math.Sqrt(normB));
        }
    }
}
