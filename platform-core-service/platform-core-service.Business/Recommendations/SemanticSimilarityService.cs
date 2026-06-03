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

        public async Task<double> ScorePostAsync(Post candidate, string profileId, bool qaOnly = false)
        {
            try
            {
                var scores = await ScorePostsAsync([candidate], profileId, qaOnly);
                return scores.GetValueOrDefault(candidate.Id, 0);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Warn($"[SemanticSimilarityService] Falling back without AI semantic score: {ex.Message}");
                return 0;
            }
        }

        public async Task<Dictionary<string, double>> ScorePostsAsync(
            IReadOnlyCollection<Post> candidates,
            string profileId,
            bool qaOnly = false)
        {
            var scores = candidates.ToDictionary(candidate => candidate.Id, _ => 0.0);
            if (candidates.Count == 0)
                return scores;

            try
            {
                var referenceIds = await GetReferenceContentIdsAsync(profileId, qaOnly);
                if (referenceIds.Count == 0)
                    return scores;

                var referencePosts = await _context.Posts
                    .Where(p => referenceIds.Contains(p.Id))
                    .Include(p => p.PostTags).ThenInclude(pt => pt.Tag)
                    .AsNoTracking()
                    .ToListAsync();

                if (referencePosts.Count == 0)
                    return scores;

                var embeddingInputs = candidates
                    .Concat(referencePosts)
                    .GroupBy(post => post.Id)
                    .Select(group => group.First())
                    .ToDictionary(post => post.Id, BuildContentText);

                var embeddings = await GetEmbeddingsAsync(embeddingInputs);
                var referenceEmbeddings = referencePosts
                    .Select(reference => embeddings.GetValueOrDefault(reference.Id))
                    .Where(embedding => embedding is { Count: > 0 })
                    .ToList();

                if (referenceEmbeddings.Count == 0)
                    return scores;

                foreach (var candidate in candidates)
                {
                    var candidateEmbedding = embeddings.GetValueOrDefault(candidate.Id);
                    if (candidateEmbedding is not { Count: > 0 })
                        continue;

                    var bestScore = referenceEmbeddings.Max(referenceEmbedding =>
                        CosineSimilarity(candidateEmbedding, referenceEmbedding));

                    scores[candidate.Id] = Math.Clamp(bestScore * 5.0, 0, 5.0);
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Warn($"[SemanticSimilarityService] Falling back without AI semantic batch score: {ex.Message}");
            }

            return scores;
        }

        private async Task<List<string>> GetReferenceContentIdsAsync(string profileId, bool qaOnly)
        {
            var cutoff = DateTimeOffset.UtcNow.AddDays(-30);
            var query = _context.UserContentInteractions
                .Where(i => i.ProfileId == profileId && i.DateCreated > cutoff);

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
            var embeddings = await GetEmbeddingsAsync(new Dictionary<string, string>
            {
                [contentId] = text
            });

            return embeddings.GetValueOrDefault(contentId, []);
        }

        private async Task<Dictionary<string, List<float>>> GetEmbeddingsAsync(IReadOnlyDictionary<string, string> contentTexts)
        {
            var embeddings = new Dictionary<string, List<float>>();
            var missingItems = new List<AIEmbeddingItemDTO>();

            foreach (var (contentId, text) in contentTexts)
            {
                var cached = await _cache.GetCacheAsync<List<float>>(GetEmbeddingCacheKey(contentId));
                if (cached is { Count: > 0 })
                {
                    embeddings[contentId] = cached;
                    continue;
                }

                missingItems.Add(new AIEmbeddingItemDTO
                {
                    Id = contentId,
                    Text = text
                });
            }

            if (missingItems.Count == 0)
                return embeddings;

            var result = await _aiWorkerClient.GetRecommendationEmbeddingsAsync(new AIBatchEmbeddingRequestDTO
            {
                Items = missingItems
            });

            if (result.Result?.Items == null || result.Result.Items.Count == 0)
                return embeddings;

            foreach (var item in result.Result.Items)
            {
                if (string.IsNullOrWhiteSpace(item.Id) || item.Embedding.Count == 0)
                    continue;

                embeddings[item.Id] = item.Embedding;
                await _cache.SetCacheAsync(GetEmbeddingCacheKey(item.Id), item.Embedding, new DistributedCacheEntryOptions
                {
                    SlidingExpiration = TimeSpan.FromDays(7)
                });
            }

            return embeddings;
        }

        private static string GetEmbeddingCacheKey(string contentId) => $"recommendation_embedding:{contentId}";

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
