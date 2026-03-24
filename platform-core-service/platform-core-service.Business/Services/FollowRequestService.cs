using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Helper;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.FollowRequest;
using platform_core_service.Common.Models.DTOs.EntityDTO.UserFollow;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using platform_core_service.Common.Models.DTOs.HelperDTO;

namespace platform_core_service.Business.Services
{
    public class FollowRequestService
    (
        ApplicationDbContext dbContext,
        IMapper mapper,
        IRepository<FollowRequest, string> repository,
        IUserContext userContext
    ) : IFollowRequestService
    {
        private readonly ApplicationDbContext _dbContext = dbContext;
        private readonly IMapper _mapper = mapper;
        private readonly IRepository<FollowRequest, string> _repository = repository;
        private readonly IUserContext _userContext = userContext;

        public async Task<ReturnResult<SelectUserFollow>> ApproveFollowRequest(string requestId)
        {
            ReturnResult<SelectUserFollow> returnResult = new();
            try
            {
                var existingFollowRequest = await _dbContext.FollowRequests.Where(x => x.Id == requestId
                                                                                    && x.TargetProfileId == _userContext.ProfileId)
                                                                                    .FirstOrDefaultAsync();
                if (existingFollowRequest == null)
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_FOUND, "follow request", requestId);
                }
                else
                {
                    var alreadyFollowing = await _dbContext.UserFollows
                        .AnyAsync(x => x.OwnerId == existingFollowRequest.RequesterProfileId
                                    && x.FollowingProfileId == existingFollowRequest.TargetProfileId);

                    if (alreadyFollowing)
                    {
                        _dbContext.Remove(existingFollowRequest);
                        await _dbContext.SaveChangesAsync();
                        returnResult.Message = "Already following this profile.";
                    }
                    else
                    {
                        var newUserFollow = new UserFollow
                        {
                            OwnerId = existingFollowRequest.RequesterProfileId,
                            FollowingProfileId = existingFollowRequest.TargetProfileId
                        };
                        await _dbContext.UserFollows.AddAsync(newUserFollow);
                        _dbContext.FollowRequests.Remove(existingFollowRequest);
                        if (await _dbContext.SaveChangesAsync() > 0)
                        {
                            returnResult.Result = _mapper.Map<SelectUserFollow>(newUserFollow);
                        }
                        else returnResult.Message = ResponseMessage.MESSAGE_OPERATION_CANT_BE_DONE;
                    }
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error approving follow request: {ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        public async Task<ReturnResult<bool>> CancelFollowRequest(string requestId)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                var existingFollowRequest = await _dbContext.FollowRequests.Where(x => x.Id == requestId
                                                                                && x.RequesterProfileId == _userContext.ProfileId)
                                                                                .FirstOrDefaultAsync();
                if (existingFollowRequest == null)
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_FOUND, "follow request", requestId);
                }
                else
                {
                    _dbContext.FollowRequests.Remove(existingFollowRequest);
                    if (await _dbContext.SaveChangesAsync() > 0)
                    {
                        returnResult.Result = true;
                    }
                    else returnResult.Message = ResponseMessage.MESSAGE_OPERATION_CANT_BE_DONE;
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error canceling follow request: {ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        public async Task<ReturnResult<bool>> RejectFollowRequest(string requestId)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                var existingFollowRequest = await _dbContext.FollowRequests.Where(x => x.Id == requestId
                                                                                && x.TargetProfileId == _userContext.ProfileId)
                                                                                .FirstOrDefaultAsync();
                if (existingFollowRequest == null)
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_FOUND, "follow request", requestId);
                }
                else
                {
                    _dbContext.FollowRequests.Remove(existingFollowRequest);
                    if (await _dbContext.SaveChangesAsync() > 0)
                    {
                        returnResult.Result = true;
                    }
                    else returnResult.Message = ResponseMessage.MESSAGE_OPERATION_CANT_BE_DONE;
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error rejecting follow request: {ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        public async Task<ReturnResult<PagedData<SelectFollowRequest, string>>> GetReceivedRequestFollow(Page<string> page)
        {
            ReturnResult<PagedData<SelectFollowRequest, string>> returnResult = new();
            try
            {
                var query = _dbContext.FollowRequests.Where(x => x.TargetProfileId == _userContext.ProfileId)
                                                    .AsNoTracking()
                                                    .Include(x => x.RequesterProfile)
                                                    .AsQueryable();
                returnResult.Result = await _repository.GetPagingAsync<Page<string>, SelectFollowRequest>(query, page);

            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error fetching follow request: {ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        public async Task<ReturnResult<PagedData<SelectFollowRequest, string>>> GetSentRequestFollow(Page<string> page)
        {
            ReturnResult<PagedData<SelectFollowRequest, string>> returnResult = new();
            try
            {
                var query = _dbContext.FollowRequests.Where(x => x.RequesterProfileId == _userContext.ProfileId)
                                                    .AsNoTracking()
                                                    .Include(x => x.TargetProfile)
                                                    .AsQueryable();
                returnResult.Result = await _repository.GetPagingAsync<Page<string>, SelectFollowRequest>(query, page);

            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error fetching follow request: {ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        public async Task<ReturnResult<int>> BulkApproveFollowRequests(List<string> requestIds)
        {
            ReturnResult<int> returnResult = new();
            try
            {
                var requests = await _dbContext.FollowRequests
                    .Where(x => requestIds.Contains(x.Id) && x.TargetProfileId == _userContext.ProfileId)
                    .ToListAsync();

                if (requests.Count == 0)
                {
                    returnResult.Message = "None of the specified follow requests were found.";
                    return returnResult;
                }

                //This one is a list of array containing the profileId that following the usercontext.profileId
                var existingFollowPairs = await _dbContext.UserFollows
                    .Where(x => x.FollowingProfileId == _userContext.ProfileId
                             && requests.Select(r => r.RequesterProfileId).Contains(x.OwnerId))
                    .Select(x => x.OwnerId)
                    .ToListAsync();

                //Create userfollow except for the already follow (the list above)
                var newFollows = requests
                    .Where(r => !existingFollowPairs.Contains(r.RequesterProfileId))
                    .Select(r => new UserFollow
                    {
                        OwnerId = r.RequesterProfileId,
                        FollowingProfileId = r.TargetProfileId
                    }).ToList();

                await _dbContext.UserFollows.AddRangeAsync(newFollows);
                _dbContext.FollowRequests.RemoveRange(requests);

                if (await _dbContext.SaveChangesAsync() > 0)
                {
                    returnResult.Result = newFollows.Count;
                }
                else returnResult.Message = ResponseMessage.MESSAGE_OPERATION_CANT_BE_DONE;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error bulk approving follow requests: {ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        public async Task<ReturnResult<int>> BulkRejectFollowRequests(List<string> requestIds)
        {
            ReturnResult<int> returnResult = new();
            try
            {
                var requests = await _dbContext.FollowRequests
                    .Where(x => requestIds.Contains(x.Id) && x.TargetProfileId == _userContext.ProfileId)
                    .ToListAsync();

                if (requests.Count == 0)
                {
                    returnResult.Message = "None of the specified follow requests were found.";
                    return returnResult;
                }

                _dbContext.FollowRequests.RemoveRange(requests);
                if (await _dbContext.SaveChangesAsync() > 0)
                {
                    returnResult.Result = requests.Count;
                }
                else returnResult.Message = ResponseMessage.MESSAGE_OPERATION_CANT_BE_DONE;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error bulk rejecting follow requests: {ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        public async Task<ReturnResult<int>> BulkCancelFollowRequests(List<string> requestIds)
        {
            ReturnResult<int> returnResult = new();
            try
            {
                var requests = await _dbContext.FollowRequests
                    .Where(x => requestIds.Contains(x.Id) && x.RequesterProfileId == _userContext.ProfileId)
                    .ToListAsync();

                if (requests.Count == 0)
                {
                    returnResult.Message = "None of the specified follow requests were found.";
                    return returnResult;
                }

                _dbContext.FollowRequests.RemoveRange(requests);
                if (await _dbContext.SaveChangesAsync() > 0)
                {
                    returnResult.Result = requests.Count;
                }
                else returnResult.Message = ResponseMessage.MESSAGE_OPERATION_CANT_BE_DONE;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error bulk canceling follow requests: {ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }
    }
}
