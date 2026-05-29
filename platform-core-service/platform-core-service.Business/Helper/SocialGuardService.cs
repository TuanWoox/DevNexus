using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Utils.Extensions;
using platform_core_service.Common.Attributes;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Helper;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Helper;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;

namespace platform_core_service.Business.Helper
{
    public class SocialGuardService
    (
        ApplicationDbContext applicationDbContext,
        IUserContext userContext
    ) : ISocialGuardService
    {
        private readonly ApplicationDbContext _dbContext = applicationDbContext;
        private readonly IUserContext _userContext = userContext;

        public async Task<ReturnResult<bool>> CheckAddingPost(CreatePostDTO createPostDTO)
        {
            try
            {
                if (createPostDTO == null)
                {
                    return Denied("Post data is required");
                }

                if (!string.IsNullOrEmpty(createPostDTO.CommunityId))
                {
                    var communityAccess = await CheckBelongToCommunity(createPostDTO.CommunityId);
                    if (!communityAccess.Result) return communityAccess;

                    var muteCheck = await CheckIsMutedInCommunityAsync(_userContext.ProfileId, createPostDTO.CommunityId);
                    if (muteCheck.Message != null) return muteCheck;
                }

                return Success();
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                return Denied(ResponseMessage.MESSAGE_TECHNICAL_ISSUE);
            }
        }

        public async Task<ReturnResult<bool>> CheckVisibleContent([TrimmedRequired] string authorId, string? communityId = null)
        {
            try
            {
                if (string.IsNullOrEmpty(communityId))
                {
                    return await CanViewProfilePersonalContent(authorId);
                }

                if (await IsBlockedRelation(_userContext.ProfileId, authorId))
                {
                    return Denied(ResponseMessage.BLOCKED_OR_NOT_AVAILABLE);
                }

                return await CheckBelongToCommunity(communityId);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                return Denied(ResponseMessage.MESSAGE_TECHNICAL_ISSUE);
            }
        }

        public async Task<ReturnResult<bool>> CheckBelongToCommunity([TrimmedRequired] string communityId)
        {
            try
            {
                return await CanAccessCommunity(communityId);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                return Denied(ResponseMessage.MESSAGE_TECHNICAL_ISSUE);
            }
        }

        public async Task<ReturnResult<bool>> CheckIsMutedInCommunityAsync(string profileId, string communityId)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                var activeMute = await _dbContext.CommunityMutedMembers
                    .AsNoTracking()
                    .FirstOrDefaultAsync(m => m.CommunityId == communityId
                                           && m.MutedProfileId == profileId
                                           && (m.MutedUntil == null || m.MutedUntil > DateTimeOffset.UtcNow));

                if (activeMute != null)
                {
                    returnResult.Result = true;
                    returnResult.Message = activeMute.MutedUntil.HasValue
                        ? $"You are muted in this community until {activeMute.MutedUntil.Value:g}."
                        : "You are muted in this community indefinitely.";
                    return returnResult;
                }

                returnResult.Result = false;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
            }

            return returnResult;
        }

        public async Task<ReturnResult<bool>> CheckIsCommunityAdminOrModeratorAsync(string profileId, string communityId)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                if (string.IsNullOrWhiteSpace(profileId) || string.IsNullOrWhiteSpace(communityId))
                {
                    returnResult.Message = ResponseMessage.MESSAGE_FORBIDDEN;
                    return returnResult;
                }

                var communityRole = await _dbContext.Communities
                    .AsNoTracking()
                    .Where(c => c.Id == communityId)
                    .Select(c => new
                    {
                        IsAdmin = c.OwnerId == profileId,
                        IsModerator = _dbContext.CommunityModerators
                            .Any(m => m.CommunityId == communityId && m.ModeratorId == profileId)
                    })
                    .FirstOrDefaultAsync();

                if (communityRole == null)
                {
                    returnResult.Message = "Community not found";
                    return returnResult;
                }

                if (!communityRole.IsAdmin && !communityRole.IsModerator)
                {
                    returnResult.Message = ResponseMessage.MESSAGE_FORBIDDEN;
                    return returnResult;
                }

                returnResult.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
            }

            return returnResult;
        }

        public async Task<ReturnResult<bool>> CheckProfileBlocking([TrimmedRequired] string authorId)
        {
            try
            {
                if (await IsBlockedRelation(_userContext.ProfileId, authorId))
                {
                    return Denied(ResponseMessage.BLOCKED_OR_NOT_AVAILABLE);
                }

                return Success();
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
                return Denied(ResponseMessage.MESSAGE_TECHNICAL_ISSUE);
            }
        }

        public Task<ReturnResult<bool>> CheckFollowProfile([TrimmedRequired] string authorId)
        {
            return CanViewProfilePersonalContent(authorId);
        }

        public async Task<bool> IsBlockedRelation(string viewerProfileId, string targetProfileId)
        {
            if (string.IsNullOrEmpty(viewerProfileId) ||
                string.IsNullOrEmpty(targetProfileId) ||
                viewerProfileId == targetProfileId)
            {
                return false;
            }

            return await _dbContext.ProfileBlocks
                .AsNoTracking()
                .AnyAsync(x =>
                    (x.OwnerId == viewerProfileId && x.BlockedProfileId == targetProfileId) ||
                    (x.OwnerId == targetProfileId && x.BlockedProfileId == viewerProfileId));
        }

        public async Task<ReturnResult<bool>> CanAccessProfileBasicInfo(string targetProfileId)
        {
            if (string.IsNullOrEmpty(targetProfileId))
            {
                return Denied(ResponseMessage.TARGET_NOT_FOUND);
            }

            var profileExists = await _dbContext.Profiles
                .AsNoTracking()
                .AnyAsync(x => x.Id == targetProfileId && !x.Deleted && !x.IsSuspended);

            if (!profileExists)
            {
                return Denied(ResponseMessage.PROFILE_NOT_AVAILABLE);
            }

            if (await IsBlockedRelation(_userContext.ProfileId, targetProfileId))
            {
                return Denied(ResponseMessage.BLOCKED_OR_NOT_AVAILABLE);
            }

            return Success();
        }

        public async Task<ReturnResult<bool>> CanViewProfilePersonalContent(string targetProfileId)
        {
            var basicAccess = await CanAccessProfileBasicInfo(targetProfileId);
            if (!basicAccess.Result)
            {
                return basicAccess;
            }

            var viewerProfileId = _userContext.ProfileId;
            if (targetProfileId == viewerProfileId)
            {
                return Success();
            }

            var isPrivate = await _dbContext.Profiles
                .AsNoTracking()
                .Where(x => x.Id == targetProfileId)
                .Select(x => x.IsPrivate)
                .FirstOrDefaultAsync();

            if (!isPrivate)
            {
                return Success();
            }

            var isFollowing = await _dbContext.UserFollows
                .AsNoTracking()
                .AnyAsync(x => x.OwnerId == viewerProfileId && x.FollowingProfileId == targetProfileId);

            return isFollowing
                ? Success()
                : Denied(ResponseMessage.CONTENT_NOT_AVAILABLE);
        }

        public async Task<ReturnResult<bool>> CanFollowProfile(string targetProfileId)
        {
            var basicAccess = await CanAccessProfileBasicInfo(targetProfileId);
            if (!basicAccess.Result)
            {
                return Denied(ResponseMessage.NO_PERMISSION_TO_FOLLOW);
            }

            if (targetProfileId == _userContext.ProfileId)
            {
                return Denied(ResponseMessage.NO_PERMISSION_TO_FOLLOW);
            }

            return Success();
        }

        public async Task<ReturnResult<bool>> CanViewPost(string postId)
        {
            var post = await _dbContext.Posts
                .AsNoTracking()
                .Include(x => x.Author)
                .Include(x => x.Community)
                .FirstOrDefaultAsync(x => x.Id == postId || x.Slug == postId);

            return await CanViewPostEntity(post);
        }

        public async Task<ReturnResult<bool>> CanViewQAPost(string qaPostId)
        {
            var qaPost = await _dbContext.Posts
                .OfType<QAPost>()
                .AsNoTracking()
                .Include(x => x.Author)
                .Include(x => x.Community)
                .FirstOrDefaultAsync(x => x.Id == qaPostId || x.Slug == qaPostId);

            return await CanViewPostEntity(qaPost, ResponseMessage.QUESTION_NOT_AVAILABLE);
        }

        public async Task<ReturnResult<bool>> CanSharePostAsync(string postId)
        {
            if (string.IsNullOrWhiteSpace(postId))
            {
                return Denied(ResponseMessage.CONTENT_NOT_AVAILABLE);
            }

            var canShare = await _dbContext.Posts
                .AsNoTracking()
                .ApplyShareSourceVisibilityRules(_dbContext, _userContext.ProfileId)
                .AnyAsync(p => p.Id == postId || p.Slug == postId);

            return canShare
                ? Success()
                : Denied(ResponseMessage.CONTENT_NOT_AVAILABLE);
        }

        public async Task<ReturnResult<bool>> CanViewComment(string commentId)
        {
            var comment = await _dbContext.Comments
                .AsNoTracking()
                .Include(x => x.Post)
                .Include(x => x.Answer)
                    .ThenInclude(x => x.QAPost)
                .Include(x => x.ReplyToComment)
                    .ThenInclude(x => x.Post)
                .Include(x => x.ReplyToComment)
                    .ThenInclude(x => x.Answer)
                        .ThenInclude(x => x.QAPost)
                .FirstOrDefaultAsync(x => x.Id == commentId);

            if (comment == null || comment.Deleted)
            {
                return Denied(ResponseMessage.COMMENT_NOT_AVAILABLE);
            }

            if (await IsBlockedRelation(_userContext.ProfileId, comment.AuthorId))
            {
                return Denied(ResponseMessage.BLOCKED_OR_NOT_AVAILABLE);
            }

            if (!string.IsNullOrEmpty(comment.ReplyToCommentId))
            {
                var parentAccess = await CanViewComment(comment.ReplyToCommentId);
                return parentAccess.Result ? Success() : Denied(ResponseMessage.COMMENT_NOT_AVAILABLE);
            }

            if (!string.IsNullOrEmpty(comment.PostId))
            {
                return await CanViewPost(comment.PostId);
            }

            if (!string.IsNullOrEmpty(comment.AnswerId))
            {
                return await CanViewAnswer(comment.AnswerId);
            }

            return Denied(ResponseMessage.COMMENT_NOT_AVAILABLE);
        }

        public async Task<ReturnResult<bool>> CanViewAnswer(string answerId)
        {
            var answer = await _dbContext.Answers
                .AsNoTracking()
                .Include(x => x.QAPost)
                .FirstOrDefaultAsync(x => x.Id == answerId);

            if (answer == null || answer.Deleted)
            {
                return Denied(ResponseMessage.ANSWER_NOT_AVAILABLE);
            }

            if (await IsBlockedRelation(_userContext.ProfileId, answer.AuthorId))
            {
                return Denied(ResponseMessage.BLOCKED_OR_NOT_AVAILABLE);
            }

            return await CanViewQAPost(answer.QAPostId);
        }

        public async Task<ReturnResult<bool>> CanCommentOnPost(string postId)
        {
            var guard = await GuardMutation(CanViewPost(postId), ResponseMessage.NO_PERMISSION_TO_COMMENT);
            if (!guard.Result) return guard;

            var approvalGuard = await GuardCommunityApprovalByPostId(postId, ResponseMessage.NO_PERMISSION_TO_COMMENT);
            if (!approvalGuard.Result) return approvalGuard;

            return await GuardCommunityMuteByPostId(postId);
        }

        public async Task<ReturnResult<bool>> CanCommentOnAnswer(string answerId)
        {
            var guard = await GuardMutation(CanViewAnswer(answerId), ResponseMessage.NO_PERMISSION_TO_COMMENT);
            if (!guard.Result) return guard;

            return await GuardCommunityMuteByAnswerId(answerId);
        }

        public async Task<ReturnResult<bool>> CanReplyComment(string commentId)
        {
            var guard = await GuardMutation(CanViewComment(commentId), ResponseMessage.NO_PERMISSION_TO_COMMENT);
            if (!guard.Result) return guard;

            return await GuardCommunityMuteByCommentId(commentId);
        }

        public async Task<ReturnResult<bool>> CanAnswerQuestion(string qaPostId)
        {
            var guard = await GuardMutation(CanViewQAPost(qaPostId), ResponseMessage.NO_PERMISSION_TO_ANSWER);
            if (!guard.Result) return guard;

            var approvalGuard = await GuardCommunityApprovalByQAPostId(qaPostId, ResponseMessage.NO_PERMISSION_TO_ANSWER);
            if (!approvalGuard.Result) return approvalGuard;

            return await GuardCommunityMuteByQAPostId(qaPostId);
        }

        public async Task<ReturnResult<bool>> CanVotePost(string postId)
        {
            var guard = await GuardMutation(CanViewPost(postId), ResponseMessage.NO_PERMISSION_TO_VOTE);
            if (!guard.Result) return guard;

            var approvalGuard = await GuardCommunityApprovalByPostId(postId, ResponseMessage.NO_PERMISSION_TO_VOTE);
            if (!approvalGuard.Result) return approvalGuard;

            return await GuardCommunityMuteByPostId(postId);
        }

        public async Task<ReturnResult<bool>> CanVoteAnswer(string answerId)
        {
            var guard = await GuardMutation(CanViewAnswer(answerId), ResponseMessage.NO_PERMISSION_TO_VOTE);
            if (!guard.Result) return guard;

            return await GuardCommunityMuteByAnswerId(answerId);
        }

        public async Task<ReturnResult<bool>> CanVoteComment(string commentId)
        {
            var guard = await GuardMutation(CanViewComment(commentId), ResponseMessage.NO_PERMISSION_TO_VOTE);
            if (!guard.Result) return guard;

            return await GuardCommunityMuteByCommentId(commentId);
        }

        public Task<ReturnResult<bool>> CanSavePost(string postId)
        {
            return GuardSavePost(postId);
        }

        public Task<ReturnResult<bool>> CanSaveQuestion(string qaPostId)
        {
            return GuardSaveQuestion(qaPostId);
        }

        public async Task<ReturnResult<bool>> CanRemoveBookmark(string bookmarkItemId)
        {
            var belongsToViewer = await _dbContext.BookMarkedItems
                .AsNoTracking()
                .AnyAsync(x => x.Id == bookmarkItemId && x.BookMark.OwnerId == _userContext.ProfileId);

            return belongsToViewer ? Success() : Denied(ResponseMessage.TARGET_NOT_FOUND);
        }

        private async Task<ReturnResult<bool>> CanViewPostEntity(Post? post, string unavailableMessage = null)
        {
            unavailableMessage ??= ResponseMessage.CONTENT_NOT_AVAILABLE;

            if (post == null || post.Deleted)
            {
                return Denied(unavailableMessage);
            }

            var viewerProfileId = _userContext.ProfileId;
            var isOwner = post.AuthorId == viewerProfileId;
            var isCommunityStaff = !string.IsNullOrEmpty(post.CommunityId) &&
                await _dbContext.Communities
                    .AsNoTracking()
                    .AnyAsync(c => c.Id == post.CommunityId &&
                        (c.OwnerId == viewerProfileId ||
                         c.Moderators.Any(m => m.ModeratorId == viewerProfileId)));

            if (post.ModerationStatus.IsHiddenByModeration() && !isOwner)
            {
                return Denied(ResponseMessage.CONTENT_PENDING_OR_HIDDEN);
            }

            if (!string.IsNullOrEmpty(post.CommunityId) &&
                post.CommunityApprovalStatus != CommunityApprovalStatus.Approved &&
                !((isOwner || isCommunityStaff) &&
                  post.CommunityApprovalStatus == CommunityApprovalStatus.Pending))
            {
                return Denied(ResponseMessage.CONTENT_PENDING_OR_HIDDEN);
            }

            if (await IsBlockedRelation(viewerProfileId, post.AuthorId))
            {
                return Denied(ResponseMessage.BLOCKED_OR_NOT_AVAILABLE);
            }

            if (string.IsNullOrEmpty(post.CommunityId))
            {
                return await CanViewProfilePersonalContent(post.AuthorId);
            }

            return await CanAccessCommunity(post.CommunityId);
        }

        private async Task<ReturnResult<bool>> CanAccessCommunity(string communityId)
        {
            if (string.IsNullOrEmpty(communityId))
            {
                return Denied(ResponseMessage.COMMUNITY_ACCESS_REQUIRED);
            }

            var viewerProfileId = _userContext.ProfileId;
            var community = await _dbContext.Communities
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == communityId && !x.Deleted);

            if (community == null)
            {
                return Denied(ResponseMessage.COMMUNITY_ACCESS_REQUIRED);
            }

            if (!string.IsNullOrEmpty(viewerProfileId))
            {
                var isBanned = await _dbContext.CommunityBans
                    .AsNoTracking()
                    .AnyAsync(x => x.CommunityId == communityId && x.BannedProfileId == viewerProfileId);

                if (isBanned)
                {
                    return Denied(ResponseMessage.COMMUNITY_ACCESS_REQUIRED);
                }

                var isBlocked = await _dbContext.ProfileCommunityBlocks
                    .AsNoTracking()
                    .AnyAsync(x => x.CommunityId == communityId && x.ProfileId == viewerProfileId);

                if (isBlocked)
                {
                    return Denied(ResponseMessage.COMMUNITY_ACCESS_REQUIRED);
                }
            }

            if (!community.IsPrivate)
            {
                return Success();
            }

            var hasAccess = await _dbContext.Communities
                .AsNoTracking()
                .AnyAsync(x => x.Id == communityId &&
                    (x.OwnerId == viewerProfileId ||
                     x.Moderators.Any(m => m.ModeratorId == viewerProfileId) ||
                     x.Members.Any(m => m.ProfileId == viewerProfileId)));

            return hasAccess ? Success() : Denied(ResponseMessage.COMMUNITY_ACCESS_REQUIRED);
        }

        private static ReturnResult<bool> Success()
        {
            return new ReturnResult<bool> { Result = true };
        }

        private static ReturnResult<bool> Denied(string message)
        {
            return new ReturnResult<bool> { Result = false, Message = message };
        }

        private async Task<ReturnResult<bool>> GuardCommunityMuteByPostId(string postId)
        {
            var communityId = await _dbContext.Posts
                .AsNoTracking()
                .Where(p => p.Id == postId || p.Slug == postId)
                .Select(p => p.CommunityId)
                .FirstOrDefaultAsync();

            return await GuardCommunityMute(communityId);
        }

        private async Task<ReturnResult<bool>> GuardSavePost(string postId)
        {
            var guard = await GuardMutation(CanViewPost(postId), ResponseMessage.NO_PERMISSION_TO_SAVE);
            if (!guard.Result) return guard;

            return await GuardCommunityApprovalByPostId(postId, ResponseMessage.NO_PERMISSION_TO_SAVE);
        }

        private async Task<ReturnResult<bool>> GuardSaveQuestion(string qaPostId)
        {
            var guard = await GuardMutation(CanViewQAPost(qaPostId), ResponseMessage.NO_PERMISSION_TO_SAVE);
            if (!guard.Result) return guard;

            return await GuardCommunityApprovalByQAPostId(qaPostId, ResponseMessage.NO_PERMISSION_TO_SAVE);
        }

        private async Task<ReturnResult<bool>> GuardCommunityApprovalByPostId(string postId, string deniedMessage)
        {
            var approval = await _dbContext.Posts
                .AsNoTracking()
                .Where(p => p.Id == postId || p.Slug == postId)
                .Select(p => new { p.CommunityId, p.CommunityApprovalStatus })
                .FirstOrDefaultAsync();

            return IsCommunityApproved(approval?.CommunityId, approval?.CommunityApprovalStatus)
                ? Success()
                : Denied(deniedMessage);
        }

        private async Task<ReturnResult<bool>> GuardCommunityApprovalByQAPostId(string qaPostId, string deniedMessage)
        {
            var approval = await _dbContext.Posts
                .OfType<QAPost>()
                .AsNoTracking()
                .Where(p => p.Id == qaPostId || p.Slug == qaPostId)
                .Select(p => new { p.CommunityId, p.CommunityApprovalStatus })
                .FirstOrDefaultAsync();

            return IsCommunityApproved(approval?.CommunityId, approval?.CommunityApprovalStatus)
                ? Success()
                : Denied(deniedMessage);
        }

        private static bool IsCommunityApproved(string? communityId, CommunityApprovalStatus? status)
        {
            return string.IsNullOrEmpty(communityId) || status == CommunityApprovalStatus.Approved;
        }

        private async Task<ReturnResult<bool>> GuardCommunityMuteByQAPostId(string qaPostId)
        {
            var communityId = await _dbContext.Posts
                .OfType<QAPost>()
                .AsNoTracking()
                .Where(p => p.Id == qaPostId || p.Slug == qaPostId)
                .Select(p => p.CommunityId)
                .FirstOrDefaultAsync();

            return await GuardCommunityMute(communityId);
        }

        private async Task<ReturnResult<bool>> GuardCommunityMuteByAnswerId(string answerId)
        {
            var communityId = await _dbContext.Answers
                .AsNoTracking()
                .Where(a => a.Id == answerId)
                .Select(a => a.QAPost.CommunityId)
                .FirstOrDefaultAsync();

            return await GuardCommunityMute(communityId);
        }

        private async Task<ReturnResult<bool>> GuardCommunityMuteByCommentId(string commentId)
        {
            var comment = await _dbContext.Comments
                .AsNoTracking()
                .Include(c => c.Post)
                .Include(c => c.Answer)
                    .ThenInclude(a => a.QAPost)
                .Include(c => c.ReplyToComment)
                    .ThenInclude(rc => rc.Post)
                .Include(c => c.ReplyToComment)
                    .ThenInclude(rc => rc.Answer)
                        .ThenInclude(a => a.QAPost)
                .FirstOrDefaultAsync(c => c.Id == commentId);

            var communityId = comment?.Post?.CommunityId
                ?? comment?.Answer?.QAPost?.CommunityId
                ?? comment?.ReplyToComment?.Post?.CommunityId
                ?? comment?.ReplyToComment?.Answer?.QAPost?.CommunityId;

            return await GuardCommunityMute(communityId);
        }

        private async Task<ReturnResult<bool>> GuardCommunityMute(string? communityId)
        {
            if (string.IsNullOrEmpty(communityId))
            {
                return Success();
            }

            var muteCheck = await CheckIsMutedInCommunityAsync(_userContext.ProfileId, communityId);
            return muteCheck.Result
                ? Denied(muteCheck.Message ?? "You are muted in this community.")
                : Success();
        }

        private static async Task<ReturnResult<bool>> GuardMutation(Task<ReturnResult<bool>> guardTask, string deniedMessage)
        {
            var guard = await guardTask;
            return guard.Result ? Success() : Denied(deniedMessage);
        }
    }
}
