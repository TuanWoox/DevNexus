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
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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

                if(!string.IsNullOrEmpty(createPostDTO.CommunityId))
                {
                    returnResult = await CheckBelongToCommunity(createPostDTO.CommunityId);
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
        public async Task<ReturnResult<bool>> CheckCanInteractWithContent([TrimmedRequired] string authorId, string? communityId = null)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                if (!string.IsNullOrEmpty(communityId))
                {
                    returnResult = await CheckBelongToCommunity(communityId);
                    if (returnResult.Message != null) return returnResult;
                }

                // Run block and follow checks in parallel — they hit different tables
                var blockTask = CheckProfileBlocking(authorId);
                var followTask = CheckFollowProfile(authorId);
                await Task.WhenAll(blockTask, followTask);

                if (blockTask.Result.Message != null)
                {
                    returnResult.Message = blockTask.Result.Message;
                    return returnResult;
                }
                if (followTask.Result.Message != null)
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
                // Two lightweight AnyAsync queries instead of loading the full entity graph
                var communityExists = await _dbContext.Communities
                                                      .AsNoTracking()
                                                      .AnyAsync(x => x.Id == communityId);
                if (!communityExists)
                {
                    returnResult.Message = "Community not found";
                    return returnResult;
                }

                var isMember = await _dbContext.CommunityMembers
                                               .AsNoTracking()
                                               .AnyAsync(x => x.CommunityId == communityId && x.ProfileId == _userContext.ProfileId);
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
            catch(Exception ex)
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
