using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Utils.Enums;
using PostEntity = platform_core_service.Common.Entities.DbEntities.Post;

namespace platform_core_service.Business.Utils.Extensions
{
    public static class ModerationVisibilityQueryExtensions
    {
        public static IQueryable<PostEntity> ApplyPublicModerationVisibility(
            this IQueryable<PostEntity> query)
        {
            return query.Where(p =>
                !p.Deleted &&
                (p.ModerationStatus == ModerationStatus.Pending ||
                 p.ModerationStatus == ModerationStatus.Approved ||
                 p.ModerationStatus == ModerationStatus.InReview));
        }

        public static IQueryable<QAPost> ApplyPublicModerationVisibility(
            this IQueryable<QAPost> query)
        {
            return query.Where(p =>
                !p.Deleted &&
                (p.ModerationStatus == ModerationStatus.Pending ||
                 p.ModerationStatus == ModerationStatus.Approved ||
                 p.ModerationStatus == ModerationStatus.InReview));
        }

        public static IQueryable<PostEntity> ApplyPostCommunityApprovalVisibility(
            this IQueryable<PostEntity> query)
        {
            return query.Where(p =>
                p.CommunityApprovalStatus == null ||
                p.CommunityApprovalStatus == CommunityApprovalStatus.Approved);
        }

        public static IQueryable<QAPost> ApplyQAPostCommunityApprovalVisibility(
            this IQueryable<QAPost> query,
            string currentProfileId)
        {
            return query.Where(p =>
                p.CommunityApprovalStatus == null ||
                p.CommunityApprovalStatus == CommunityApprovalStatus.Approved ||
                (p.CommunityId != null &&
                 (p.AuthorId == currentProfileId ||
                  p.Community!.OwnerId == currentProfileId ||
                  p.Community.Moderators.Any(m => m.ModeratorId == currentProfileId)) &&
                 p.CommunityApprovalStatus == CommunityApprovalStatus.Pending));
        }
    }
}
