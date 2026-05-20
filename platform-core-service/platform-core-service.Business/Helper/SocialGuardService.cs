using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Attributes;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Helper;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Helper;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Common.Models.DTOs.HelperDTO;
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
            ReturnResult<bool> returnResult = new();
            try
            {
                // Step 1: Validate input
                if (createPostDTO == null)
                {
                    returnResult.Message = "Post data is required";
                    return returnResult;
                }

                if (!string.IsNullOrEmpty(createPostDTO.CommunityId))
                {
                    returnResult = await CheckBelongToCommunity(createPostDTO.CommunityId);
                    if (returnResult.Message != null) return returnResult;

                    returnResult = await CheckIsMutedInCommunityAsync(_userContext.ProfileId, createPostDTO.CommunityId);
                    if (returnResult.Message != null) return returnResult;
                }

                returnResult.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
            }
            return returnResult;
        }
        public async Task<ReturnResult<bool>> CheckVisibleContent([TrimmedRequired] string authorId, string? communityId = null)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                if (!string.IsNullOrEmpty(communityId))
                {
                    returnResult = await CheckBelongToCommunity(communityId);
                    if (returnResult.Message != null) return returnResult;
                }

                var blockTask = CheckProfileBlocking(authorId);

                // Only check follow when not in a community
                var followTask = string.IsNullOrEmpty(communityId)
                    ? CheckFollowProfile(authorId)
                    : Task.FromResult(new ReturnResult<bool>());

                await Task.WhenAll(blockTask, followTask);

                if (blockTask.Result.Message != null)
                {
                    returnResult.Message = blockTask.Result.Message;
                    return returnResult;
                }

                if (string.IsNullOrEmpty(communityId) && followTask.Result.Message != null)
                {
                    returnResult.Message = followTask.Result.Message;
                    return returnResult;
                }

                returnResult.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
            }
            return returnResult;
        }

        public async Task<ReturnResult<bool>> CheckBelongToCommunity([TrimmedRequired] string communityId)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                var profileId = _userContext.ProfileId;

                // Step 1: Verify community exists
                //var communityExists = await _dbContext.Communities
                //                                      .AsNoTracking()
                //                                      .AnyAsync(x => x.Id == communityId);
                var community = await _dbContext.Communities.FindAsync(communityId);
                if (community == null)
                {
                    returnResult.Message = "Community not found";
                    return returnResult;
                }

                // ── Ban check: MUST run before public short-circuit ──────────────────
                // A banned user is blocked regardless of whether the community is public
                // or private. Checking early prevents the !IsPrivate path from bypassing
                // the ban entirely.
                if (!string.IsNullOrEmpty(profileId))
                {
                    var isBanned = await _dbContext.CommunityBans
                                                   .AsNoTracking()
                                                   .AnyAsync(b => b.CommunityId == communityId
                                                                && b.BannedProfileId == profileId);
                    if (isBanned)
                    {
                        returnResult.Message = ResponseMessage.MESSAGE_FORBIDDEN;
                        return returnResult;
                    }
                }

                // If the community is public => everyone (non-banned) can view its content
                if (!community.IsPrivate)
                {
                    returnResult.Result = true;
                    return returnResult;
                }

                // Step 2: Owner always has access — check first to avoid false FORBIDDEN
                var isOwner = await _dbContext.Communities
                                              .AsNoTracking()
                                              .AnyAsync(c => c.Id == communityId && c.OwnerId == profileId);
                if (isOwner)
                {
                    returnResult.Result = true;
                    return returnResult;
                }

                // Step 3: Moderators have access
                var isModerator = await _dbContext.CommunityModerators
                                                  .AsNoTracking()
                                                  .AnyAsync(m => m.CommunityId == communityId && m.ModeratorId == profileId);
                if (isModerator)
                {
                    returnResult.Result = true;
                    return returnResult;
                }

                // Step 4: Regular members have access
                var isMember = await _dbContext.CommunityMembers
                                               .AsNoTracking()
                                               .AnyAsync(x => x.CommunityId == communityId && x.ProfileId == profileId);
                if (!isMember)
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

        public async Task<ReturnResult<bool>> CheckProfileBlocking([TrimmedRequired] string authorId)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                if (authorId != _userContext.ProfileId)
                {
                    var blockExists = await _dbContext.ProfileBlocks
                                     .Where(x =>
                                         (x.OwnerId == _userContext.ProfileId && x.BlockedProfileId == authorId) ||
                                         (x.OwnerId == authorId && x.BlockedProfileId == _userContext.ProfileId))
                                     .AsNoTracking()
                                     .AnyAsync();
                    if (blockExists)
                    {
                        returnResult.Message = ResponseMessage.MESSAGE_FORBIDDEN;
                        return returnResult;
                    }
                }
                returnResult.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
            }
            return returnResult;
        }

        public async Task<ReturnResult<bool>> CheckFollowProfile([TrimmedRequired] string authorId)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                if (authorId != _userContext.ProfileId)
                {
                    // Only enforce the follow requirement for private profiles
                    var isPrivate = await _dbContext.Profiles
                                                    .Where(x => x.Id == authorId)
                                                    .AsNoTracking()
                                                    .Select(x => x.IsPrivate)
                                                    .FirstOrDefaultAsync();

                    if (isPrivate)
                    {
                        var isFollowing = await _dbContext.UserFollows
                                                         .AsNoTracking()
                                                         .AnyAsync(x => x.OwnerId == _userContext.ProfileId
                                                                     && x.FollowingProfileId == authorId);
                        if (!isFollowing)
                        {
                            returnResult.Message = ResponseMessage.MESSAGE_FORBIDDEN;
                            return returnResult;
                        }
                    }
                }
                returnResult.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug(ex.Message);
            }
            return returnResult;
        }
    }
}
