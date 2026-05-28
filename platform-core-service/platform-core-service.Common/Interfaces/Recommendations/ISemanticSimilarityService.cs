using platform_core_service.Common.Entities.DbEntities;

namespace platform_core_service.Common.Interfaces.Recommendations
{
    public interface ISemanticSimilarityService
    {
        Task<double> ScorePostAsync(Post candidate, string userId, bool qaOnly = false);
    }
}
