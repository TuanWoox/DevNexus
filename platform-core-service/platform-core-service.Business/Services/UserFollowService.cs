using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Helper;
using platform_core_service.Common.Interfaces;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.FollowRequest;
using platform_core_service.Common.Models.DTOs.EntityDTO.UserFollow;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using shared_contracts.Models.DTOs.HelperDTO;

namespace platform_core_service.Business.Services
{
    public class UserFollowService
    (
        ApplicationDbContext dbContext,
        IMapper mapper,
        IRepository<UserFollow, string> repository,
        IUserContext userContext
    ) : IUserFollowService
    {
        private readonly ApplicationDbContext _dbContext = dbContext;
        private readonly IMapper _mapper = mapper;
        private readonly IRepository<UserFollow, string> _repository = repository;
        private readonly IUserContext _userContext = userContext;

        public async Task<ReturnResult<object>> CreateAsync(CreateUserFollow createUserFollow)
        {
            ReturnResult<object> returnResult = new ReturnResult<object>();
            try
            {
                // Guard: prevent self-follow
                if (_userContext.ProfileId == createUserFollow.FollowingProfileId)
                {
                    returnResult.Message = "You cannot follow yourself.";
                    return returnResult;
                }

                var existingFollowingProfile = await _dbContext.Profiles.Where(x => x.Id == createUserFollow.FollowingProfileId)
                                                                        .AsNoTracking()
                                                                        .FirstOrDefaultAsync();
                var existingBlock = await _dbContext.ProfileBlocks.Where(x =>
                                                                (x.BlockedProfileId == _userContext.ProfileId && x.OwnerId == createUserFollow.FollowingProfileId) ||
                                                                (x.OwnerId == _userContext.ProfileId && x.BlockedProfileId == createUserFollow.FollowingProfileId)
                                                            )
                                                            .AsNoTracking()
                                                            .FirstOrDefaultAsync();
                // If there is no profile or there is a block that may come from one side => just notify that can't find profile
                if (existingFollowingProfile == null || existingBlock != null)
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_FOUND, "profile", createUserFollow.FollowingProfileId);
                    return returnResult;
                }

                // If already follow => then just tell them that they just already follow
                var existingFollow = await _dbContext.UserFollows.Where(x => x.OwnerId == _userContext.ProfileId
                                                                && x.FollowingProfileId == createUserFollow.FollowingProfileId)
                                                                .AsNoTracking()
                                                                .FirstOrDefaultAsync();
                if (existingFollow != null)
                {
                    returnResult.Message = "You are following this profile";
                    return returnResult;
                }
                //IF private create follow request else create userfollow
                if (existingFollowingProfile.IsPrivate)
                {
                    // Guard: prevent duplicate pending follow requests
                    var existingRequest = await _dbContext.FollowRequests
                        .Where(x => x.RequesterProfileId == _userContext.ProfileId
                                 && x.TargetProfileId == createUserFollow.FollowingProfileId)
                        .AsNoTracking()
                        .FirstOrDefaultAsync();
                    if (existingRequest != null)
                    {
                        returnResult.Message = "You already have a pending follow request for this profile.";
                        return returnResult;
                    }

                    var followRequest = new FollowRequest
                    {
                        RequesterProfileId = _userContext.ProfileId,
                        TargetProfileId = createUserFollow.FollowingProfileId
                    };
                    await _dbContext.FollowRequests.AddAsync(followRequest);
                    if (await _dbContext.SaveChangesAsync() > 0)
                    {
                        returnResult.Result = _mapper.Map<SelectFollowRequest>(followRequest);
                    }
                    else returnResult.Message = ResponseMessage.MESSAGE_OPERATION_CANT_BE_DONE;
                }
                else
                {
                    var userFollow = _mapper.Map<UserFollow>(createUserFollow);
                    userFollow.OwnerId = _userContext.ProfileId;
                    await _dbContext.UserFollows.AddAsync(userFollow);
                    if (await _dbContext.SaveChangesAsync() > 0)
                    {
                        returnResult.Result = _mapper.Map<SelectUserFollow>(userFollow);
                    }
                    else returnResult.Message = ResponseMessage.MESSAGE_OPERATION_CANT_BE_DONE;
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error requesting follow: {ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        public async Task<ReturnResult<PagedData<SelectUserFollow, string>>> GetFollowers(Page<string> page)
        {
            ReturnResult<PagedData<SelectUserFollow, string>> returnResult = new();
            try
            {
                var query = _dbContext.UserFollows.Where(x => x.FollowingProfileId == _userContext.ProfileId)
                                                .AsNoTracking()
                                                .Include(x => x.Owner)
                                                .AsQueryable();
                returnResult.Result = await _repository.GetPagingAsync<Page<string>, SelectUserFollow>(query, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error fetching followers: {ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        public async Task<ReturnResult<PagedData<SelectUserFollow, string>>> GetFollowings(Page<string> page)
        {
            ReturnResult<PagedData<SelectUserFollow, string>> returnResult = new();
            try
            {
                var query = _dbContext.UserFollows.Where(x => x.OwnerId == _userContext.ProfileId)
                                                .AsNoTracking()
                                                .Include(x => x.FollowingProfile)
                                                .AsQueryable();
                returnResult.Result = await _repository.GetPagingAsync<Page<string>, SelectUserFollow>(query, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error fetching followings: {ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        public async Task<ReturnResult<bool>> DeleteById(string followId)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                var existingFollow = await _dbContext.UserFollows.Where(x => x.Id == followId
                                                                        && (x.FollowingProfileId == _userContext.ProfileId
                                                                        || x.OwnerId == _userContext.ProfileId))
                                                                        .FirstOrDefaultAsync();
                if (existingFollow == null)
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_FOUND, "follow", followId);
                    return returnResult;
                }
                _dbContext.UserFollows.Remove(existingFollow);
                if (await _dbContext.SaveChangesAsync() > 0)
                {
                    returnResult.Result = true;
                }
                else returnResult.Message = ResponseMessage.MESSAGE_OPERATION_CANT_BE_DONE;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error deleting follow: {ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        public async Task<ReturnResult<int>> BulkDeleteByIds(List<string> followIds)
        {
            ReturnResult<int> returnResult = new();
            try
            {
                var follows = await _dbContext.UserFollows
                    .Where(x => followIds.Contains(x.Id)
                             && (x.OwnerId == _userContext.ProfileId
                              || x.FollowingProfileId == _userContext.ProfileId))
                    .ToListAsync();

                if (follows.Count == 0)
                {
                    returnResult.Message = "None of the specified follow records were found.";
                    return returnResult;
                }

                _dbContext.UserFollows.RemoveRange(follows);
                if (await _dbContext.SaveChangesAsync() > 0)
                {
                    returnResult.Result = follows.Count;
                }
                else returnResult.Message = ResponseMessage.MESSAGE_OPERATION_CANT_BE_DONE;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error bulk deleting follows: {ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

    }
}