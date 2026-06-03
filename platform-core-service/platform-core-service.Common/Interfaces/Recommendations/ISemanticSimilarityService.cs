using platform_core_service.Common.Entities.DbEntities;

namespace platform_core_service.Common.Interfaces.Recommendations
{
    public interface ISemanticSimilarityService
    {
        Task<double> ScorePostAsync(Post candidate, string profileId, bool qaOnly = false);
        Task<Dictionary<string, double>> ScorePostsAsync(IReadOnlyCollection<Post> candidates, string profileId, bool qaOnly = false);
    }
}
