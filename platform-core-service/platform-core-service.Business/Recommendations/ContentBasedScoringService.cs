using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Recommendations;
using platform_core_service.Common.Models.DTOs.RecommendationDTO;

namespace platform_core_service.Business.Recommendations
{
    public class ContentBasedScoringService : IContentBasedScoringService
    {
        private const double FOLLOWED_AUTHOR_BOOST = 2.0;
        private const double COMMUNITY_MEMBER_BOOST = 1.5;
        private const double NEW_CONTENT_BOOST = 0.5;

        public double ScorePost(Post post, UserInterestProfile profile)
        {
            var score = ScoreTags(post.PostTags, profile);

            if (profile.FollowedAuthorIds.Contains(post.AuthorId))
                score += FOLLOWED_AUTHOR_BOOST;

            if (!string.IsNullOrEmpty(post.CommunityId) && profile.CommunityIds.Contains(post.CommunityId))
                score += COMMUNITY_MEMBER_BOOST;

            if (post.DateCreated >= DateTimeOffset.UtcNow.AddDays(-2))
                score += NEW_CONTENT_BOOST;

            return score;
        }

        public double ScoreQAPost(QAPost qaPost, UserInterestProfile profile)
        {
            var score = ScorePost(qaPost, profile);
            if (qaPost.Answers == null || qaPost.Answers.Count == 0)
                score += 0.75;

            return score;
        }

        public double ScoreCommunity(Community community, UserInterestProfile profile)
        {
            var communityTagScore = community.Posts?
                .SelectMany(p => p.PostTags)
                .GroupBy(pt => pt.TagId)
                .Sum(group => profile.TagWeights.GetValueOrDefault(group.Key, 0) * Math.Min(group.Count(), 5) / 5.0) ?? 0;

            var activityScore = Math.Log10((community.Posts?.Count ?? 0) + 1);
            var memberScore = Math.Log10((community.Members?.Count ?? 0) + 1);

            return communityTagScore + activityScore + memberScore;
        }

        private static double ScoreTags(IEnumerable<PostTag>? postTags, UserInterestProfile profile)
        {
            if (postTags == null || profile.TagWeights.Count == 0)
                return 0;

            var score = 0.0;
            foreach (var postTag in postTags)
            {
                score += profile.TagWeights.GetValueOrDefault(postTag.TagId, 0);
            }

            return score;
        }
    }
}
