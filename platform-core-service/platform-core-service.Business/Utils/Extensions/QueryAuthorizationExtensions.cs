using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Data;
using PostEntity = platform_core_service.Common.Entities.DbEntities.Post;

namespace platform_core_service.Business.Utils.Extensions
{
    public static class QueryAuthorizationExtensions
    {
        public static IQueryable<PostEntity> ApplyPostVisibilityRules(
            this IQueryable<PostEntity> query,
            ApplicationDbContext context,
            string currentProfileId)
        {
            return query
                .Where(p => !p.Deleted)
                .Where(p => p.ModerationStatus == ModerationStatus.Approved)
                .Where(p => !context.ProfileBlocks.Any(b =>
                    (b.OwnerId == currentProfileId && b.BlockedProfileId == p.AuthorId) ||
                    (b.OwnerId == p.AuthorId && b.BlockedProfileId == currentProfileId)))
                .Where(p =>
                    p.AuthorId == currentProfileId ||
                    !p.Author.IsPrivate ||
                    context.UserFollows.Any(f =>
                        f.OwnerId == currentProfileId &&
                        f.FollowingProfileId == p.AuthorId))
                .Where(p =>
                    p.CommunityId == null ||
                    !p.Community!.IsPrivate ||
                    p.Community.OwnerId == currentProfileId ||
                    p.Community.Moderators.Any(m => m.ModeratorId == currentProfileId) ||
                    p.Community.Members.Any(m => m.ProfileId == currentProfileId))
                .Where(p =>
                    p.CommunityId == null ||
                    !context.CommunityBans.Any(b =>
                        b.CommunityId == p.CommunityId &&
                        b.BannedProfileId == currentProfileId));
        }

        public static IQueryable<QAPost> ApplyQAPostVisibilityRules(
            this IQueryable<QAPost> query,
            ApplicationDbContext context,
            string currentProfileId)
        {
            return query
                .Where(p => !p.Deleted)
                .Where(p => p.ModerationStatus == ModerationStatus.Approved)
                .Where(p => !context.ProfileBlocks.Any(b =>
                    (b.OwnerId == currentProfileId && b.BlockedProfileId == p.AuthorId) ||
                    (b.OwnerId == p.AuthorId && b.BlockedProfileId == currentProfileId)))
                .Where(p =>
                    p.AuthorId == currentProfileId ||
                    !p.Author.IsPrivate ||
                    context.UserFollows.Any(f =>
                        f.OwnerId == currentProfileId &&
                        f.FollowingProfileId == p.AuthorId))
                .Where(p =>
                    p.CommunityId == null ||
                    !p.Community!.IsPrivate ||
                    p.Community.OwnerId == currentProfileId ||
                    p.Community.Moderators.Any(m => m.ModeratorId == currentProfileId) ||
                    p.Community.Members.Any(m => m.ProfileId == currentProfileId))
                .Where(p =>
                    p.CommunityId == null ||
                    !context.CommunityBans.Any(b =>
                        b.CommunityId == p.CommunityId &&
                        b.BannedProfileId == currentProfileId));
        }

        public static IQueryable<Profile> ApplyProfileVisibilityRules(
            this IQueryable<Profile> query,
            ApplicationDbContext context,
            string currentProfileId)
        {
            return query
                .Where(p => !p.Deleted)
                .Where(p => !p.IsSuspended)
                .Where(p => p.Id != currentProfileId)
                .Where(p => !context.ProfileBlocks.Any(b =>
                    (b.OwnerId == currentProfileId && b.BlockedProfileId == p.Id) ||
                    (b.OwnerId == p.Id && b.BlockedProfileId == currentProfileId)));
        }

        public static IQueryable<Community> ApplyCommunityVisibilityRules(
            this IQueryable<Community> query,
            ApplicationDbContext context,
            string currentProfileId)
        {
            return query
                .Where(c => !c.Deleted)
                .Where(c =>
                    !c.IsPrivate ||
                    c.OwnerId == currentProfileId ||
                    c.Moderators.Any(m => m.ModeratorId == currentProfileId) ||
                    c.Members.Any(m => m.ProfileId == currentProfileId))
                .Where(c => !context.CommunityBans.Any(b =>
                    b.CommunityId == c.Id &&
                    b.BannedProfileId == currentProfileId));
        }
    }
}
