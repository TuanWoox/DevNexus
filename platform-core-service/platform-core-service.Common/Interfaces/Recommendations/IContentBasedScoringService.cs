using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.RecommendationDTO;

namespace platform_core_service.Common.Interfaces.Recommendations
{
    public interface IContentBasedScoringService
    {
        double ScorePost(Post post, UserInterestProfile profile);
        double ScoreQAPost(QAPost qaPost, UserInterestProfile profile);
        double ScoreCommunity(Community community, UserInterestProfile profile);
    }
}
