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
                .ApplyPublicModerationVisibility()
                .ApplyPostCommunityApprovalVisibility()
                .Where(p => !context.ProfileBlocks.Any(b =>
                    (b.OwnerId == currentProfileId && b.BlockedProfileId == p.AuthorId) ||
                    (b.OwnerId == p.AuthorId && b.BlockedProfileId == currentProfileId)))
                .Where(p =>
                    (p.CommunityId == null &&
                        (p.AuthorId == currentProfileId ||
                         !p.Author.IsPrivate ||
                         context.UserFollows.Any(f =>
                             f.OwnerId == currentProfileId &&
                             f.FollowingProfileId == p.AuthorId))) ||
                    (p.CommunityId != null &&
                        (!p.Community!.IsPrivate ||
                         p.Community.OwnerId == currentProfileId ||
                         p.Community.Moderators.Any(m => m.ModeratorId == currentProfileId) ||
                         p.Community.Members.Any(m => m.ProfileId == currentProfileId))))
                .Where(p =>
                    p.CommunityId == null ||
                    !context.CommunityBans.Any(b =>
                        b.CommunityId == p.CommunityId &&
                        b.BannedProfileId == currentProfileId))
                .Where(p =>
                    p.CommunityId == null ||
                    !context.ProfileCommunityBlocks.Any(b =>
                        b.CommunityId == p.CommunityId &&
                        b.ProfileId == currentProfileId));
        }

        public static IQueryable<QAPost> ApplyQAPostVisibilityRules(
            this IQueryable<QAPost> query,
            ApplicationDbContext context,
            string currentProfileId)
        {
            return query
                .ApplyPublicModerationVisibility()
                .ApplyQAPostCommunityApprovalVisibility(currentProfileId)
                .Where(p => !context.ProfileBlocks.Any(b =>
                    (b.OwnerId == currentProfileId && b.BlockedProfileId == p.AuthorId) ||
                    (b.OwnerId == p.AuthorId && b.BlockedProfileId == currentProfileId)))
                .Where(p =>
                    (p.CommunityId == null &&
                        (p.AuthorId == currentProfileId ||
                         !p.Author.IsPrivate ||
                         context.UserFollows.Any(f =>
                             f.OwnerId == currentProfileId &&
                             f.FollowingProfileId == p.AuthorId))) ||
                    (p.CommunityId != null &&
                        (!p.Community!.IsPrivate ||
                         p.Community.OwnerId == currentProfileId ||
                         p.Community.Moderators.Any(m => m.ModeratorId == currentProfileId) ||
                         p.Community.Members.Any(m => m.ProfileId == currentProfileId))))
                .Where(p =>
                    p.CommunityId == null ||
                    !context.CommunityBans.Any(b =>
                        b.CommunityId == p.CommunityId &&
                        b.BannedProfileId == currentProfileId))
                .Where(p =>
                    p.CommunityId == null ||
                    !context.ProfileCommunityBlocks.Any(b =>
                        b.CommunityId == p.CommunityId &&
                        b.ProfileId == currentProfileId));
        }

        public static IQueryable<PostEntity> ApplyShareSourceVisibilityRules(
            this IQueryable<PostEntity> query,
            ApplicationDbContext context,
            string currentProfileId)
        {
            return query
                .ApplyPublicModerationVisibility()
                .Where(p =>
                    (p.CommunityId == null && p.CommunityApprovalStatus == null) ||
                    (p.CommunityId != null &&
                     p.CommunityApprovalStatus == CommunityApprovalStatus.Approved &&
                     p.Community != null &&
                     !p.Community.IsPrivate))
                .Where(p => !p.Author.Deleted && !p.Author.IsSuspended && !p.Author.IsPrivate)
                .Where(p => !context.ProfileBlocks.Any(b =>
                    (b.OwnerId == currentProfileId && b.BlockedProfileId == p.AuthorId) ||
                    (b.OwnerId == p.AuthorId && b.BlockedProfileId == currentProfileId)))
                .Where(p =>
                    p.CommunityId == null ||
                    !context.CommunityBans.Any(b =>
                        b.CommunityId == p.CommunityId &&
                        b.BannedProfileId == currentProfileId))
                .Where(p =>
                    p.CommunityId == null ||
                    !context.ProfileCommunityBlocks.Any(b =>
                        b.CommunityId == p.CommunityId &&
                        b.ProfileId == currentProfileId));
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
                    b.BannedProfileId == currentProfileId))
                .Where(c => !context.ProfileCommunityBlocks.Any(b =>
                    b.CommunityId == c.Id &&
                    b.ProfileId == currentProfileId));
        }

        public static IQueryable<Comment> ApplyCommentVisibilityRules(
            this IQueryable<Comment> query,
            ApplicationDbContext context,
            string currentProfileId)
        {
            return query
                .Where(c => !c.Deleted)
                .Where(c => !context.ProfileBlocks.Any(b =>
                    (b.OwnerId == currentProfileId && b.BlockedProfileId == c.AuthorId) ||
                    (b.OwnerId == c.AuthorId && b.BlockedProfileId == currentProfileId)))
                .Where(c =>
                    c.ReplyToCommentId == null ||
                    (!c.ReplyToComment!.Deleted &&
                     !context.ProfileBlocks.Any(b =>
                         (b.OwnerId == currentProfileId && b.BlockedProfileId == c.ReplyToComment.AuthorId) ||
                         (b.OwnerId == c.ReplyToComment.AuthorId && b.BlockedProfileId == currentProfileId))))
                .Where(c =>
                    (c.PostId != null &&
                        !c.Post!.Deleted &&
                        (c.Post.ModerationStatus == ModerationStatus.Pending ||
                         c.Post.ModerationStatus == ModerationStatus.Approved) &&
                        (c.Post.CommunityApprovalStatus == null ||
                         c.Post.CommunityApprovalStatus == CommunityApprovalStatus.Approved) &&
                        !context.ProfileBlocks.Any(b =>
                            (b.OwnerId == currentProfileId && b.BlockedProfileId == c.Post.AuthorId) ||
                            (b.OwnerId == c.Post.AuthorId && b.BlockedProfileId == currentProfileId)) &&
                        ((c.Post.CommunityId == null &&
                            (c.Post.AuthorId == currentProfileId ||
                             !c.Post.Author.IsPrivate ||
                             context.UserFollows.Any(f =>
                                 f.OwnerId == currentProfileId &&
                                 f.FollowingProfileId == c.Post.AuthorId))) ||
                         (c.Post.CommunityId != null &&
                            (!c.Post.Community!.IsPrivate ||
                             c.Post.Community.OwnerId == currentProfileId ||
                             c.Post.Community.Moderators.Any(m => m.ModeratorId == currentProfileId) ||
                             c.Post.Community.Members.Any(m => m.ProfileId == currentProfileId)))) &&
                        (c.Post.CommunityId == null ||
                         !context.CommunityBans.Any(b =>
                             b.CommunityId == c.Post.CommunityId &&
                             b.BannedProfileId == currentProfileId)) &&
                        (c.Post.CommunityId == null ||
                         !context.ProfileCommunityBlocks.Any(b =>
                             b.CommunityId == c.Post.CommunityId &&
                             b.ProfileId == currentProfileId))) ||
                    (c.AnswerId != null &&
                        !c.Answer!.Deleted &&
                        !context.ProfileBlocks.Any(b =>
                            (b.OwnerId == currentProfileId && b.BlockedProfileId == c.Answer.AuthorId) ||
                            (b.OwnerId == c.Answer.AuthorId && b.BlockedProfileId == currentProfileId)) &&
                        !c.Answer.QAPost.Deleted &&
                        (c.Answer.QAPost.ModerationStatus == ModerationStatus.Pending ||
                         c.Answer.QAPost.ModerationStatus == ModerationStatus.Approved) &&
                        (c.Answer.QAPost.CommunityApprovalStatus == null ||
                         c.Answer.QAPost.CommunityApprovalStatus == CommunityApprovalStatus.Approved) &&
                        !context.ProfileBlocks.Any(b =>
                            (b.OwnerId == currentProfileId && b.BlockedProfileId == c.Answer.QAPost.AuthorId) ||
                            (b.OwnerId == c.Answer.QAPost.AuthorId && b.BlockedProfileId == currentProfileId)) &&
                        ((c.Answer.QAPost.CommunityId == null &&
                            (c.Answer.QAPost.AuthorId == currentProfileId ||
                             !c.Answer.QAPost.Author.IsPrivate ||
                             context.UserFollows.Any(f =>
                                 f.OwnerId == currentProfileId &&
                                 f.FollowingProfileId == c.Answer.QAPost.AuthorId))) ||
                         (c.Answer.QAPost.CommunityId != null &&
                            (!c.Answer.QAPost.Community!.IsPrivate ||
                             c.Answer.QAPost.Community.OwnerId == currentProfileId ||
                             c.Answer.QAPost.Community.Moderators.Any(m => m.ModeratorId == currentProfileId) ||
                             c.Answer.QAPost.Community.Members.Any(m => m.ProfileId == currentProfileId)))) &&
                        (c.Answer.QAPost.CommunityId == null ||
                         !context.CommunityBans.Any(b =>
                             b.CommunityId == c.Answer.QAPost.CommunityId &&
                             b.BannedProfileId == currentProfileId)) &&
                        (c.Answer.QAPost.CommunityId == null ||
                         !context.ProfileCommunityBlocks.Any(b =>
                             b.CommunityId == c.Answer.QAPost.CommunityId &&
                             b.ProfileId == currentProfileId))) ||
                    (c.ReplyToCommentId != null &&
                        c.ReplyToComment!.PostId != null &&
                        !c.ReplyToComment.Post!.Deleted &&
                        (c.ReplyToComment.Post.ModerationStatus == ModerationStatus.Pending ||
                         c.ReplyToComment.Post.ModerationStatus == ModerationStatus.Approved) &&
                        (c.ReplyToComment.Post.CommunityApprovalStatus == null ||
                         c.ReplyToComment.Post.CommunityApprovalStatus == CommunityApprovalStatus.Approved) &&
                        !context.ProfileBlocks.Any(b =>
                            (b.OwnerId == currentProfileId && b.BlockedProfileId == c.ReplyToComment.Post.AuthorId) ||
                            (b.OwnerId == c.ReplyToComment.Post.AuthorId && b.BlockedProfileId == currentProfileId)) &&
                        ((c.ReplyToComment.Post.CommunityId == null &&
                            (c.ReplyToComment.Post.AuthorId == currentProfileId ||
                             !c.ReplyToComment.Post.Author.IsPrivate ||
                             context.UserFollows.Any(f =>
                                 f.OwnerId == currentProfileId &&
                                 f.FollowingProfileId == c.ReplyToComment.Post.AuthorId))) ||
                         (c.ReplyToComment.Post.CommunityId != null &&
                            (!c.ReplyToComment.Post.Community!.IsPrivate ||
                             c.ReplyToComment.Post.Community.OwnerId == currentProfileId ||
                             c.ReplyToComment.Post.Community.Moderators.Any(m => m.ModeratorId == currentProfileId) ||
                             c.ReplyToComment.Post.Community.Members.Any(m => m.ProfileId == currentProfileId)))) &&
                        (c.ReplyToComment.Post.CommunityId == null ||
                         !context.CommunityBans.Any(b =>
                             b.CommunityId == c.ReplyToComment.Post.CommunityId &&
                             b.BannedProfileId == currentProfileId)) &&
                        (c.ReplyToComment.Post.CommunityId == null ||
                         !context.ProfileCommunityBlocks.Any(b =>
                             b.CommunityId == c.ReplyToComment.Post.CommunityId &&
                             b.ProfileId == currentProfileId))));
        }

        public static IQueryable<Answer> ApplyAnswerVisibilityRules(
            this IQueryable<Answer> query,
            ApplicationDbContext context,
            string currentProfileId)
        {
            return query
                .Where(a => !a.Deleted)
                .Where(a => !context.ProfileBlocks.Any(b =>
                    (b.OwnerId == currentProfileId && b.BlockedProfileId == a.AuthorId) ||
                    (b.OwnerId == a.AuthorId && b.BlockedProfileId == currentProfileId)))
                .Where(a => !a.QAPost.Deleted)
                .Where(a => a.QAPost.ModerationStatus == ModerationStatus.Pending ||
                            a.QAPost.ModerationStatus == ModerationStatus.Approved)
                .Where(a => a.QAPost.CommunityApprovalStatus == null ||
                            a.QAPost.CommunityApprovalStatus == CommunityApprovalStatus.Approved)
                .Where(a => !context.ProfileBlocks.Any(b =>
                    (b.OwnerId == currentProfileId && b.BlockedProfileId == a.QAPost.AuthorId) ||
                    (b.OwnerId == a.QAPost.AuthorId && b.BlockedProfileId == currentProfileId)))
                .Where(a =>
                    (a.QAPost.CommunityId == null &&
                        (a.QAPost.AuthorId == currentProfileId ||
                         !a.QAPost.Author.IsPrivate ||
                         context.UserFollows.Any(f =>
                             f.OwnerId == currentProfileId &&
                             f.FollowingProfileId == a.QAPost.AuthorId))) ||
                    (a.QAPost.CommunityId != null &&
                        (!a.QAPost.Community!.IsPrivate ||
                         a.QAPost.Community.OwnerId == currentProfileId ||
                         a.QAPost.Community.Moderators.Any(m => m.ModeratorId == currentProfileId) ||
                         a.QAPost.Community.Members.Any(m => m.ProfileId == currentProfileId))))
                .Where(a =>
                    a.QAPost.CommunityId == null ||
                    !context.CommunityBans.Any(b =>
                        b.CommunityId == a.QAPost.CommunityId &&
                        b.BannedProfileId == currentProfileId))
                .Where(a =>
                    a.QAPost.CommunityId == null ||
                    !context.ProfileCommunityBlocks.Any(b =>
                        b.CommunityId == a.QAPost.CommunityId &&
                        b.ProfileId == currentProfileId));
        }
    }
}
