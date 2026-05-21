using AutoMapper;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Helper;
using platform_core_service.Common.Interfaces;
using platform_core_service.Common.Interfaces.BackgroundJobs;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Helper;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.FollowRequest;
using platform_core_service.Common.Models.DTOs.EntityDTO.UserFollow;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.DTOs.MessageBusDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class UserFollowService
    (
        ApplicationDbContext dbContext,
        IMapper mapper,
        IRepository<UserFollow, string> repository,
        IUserContext userContext,
        IBackgroundJobClient backgroundJobClient,
        ISocialGuardService socialGuardService
    ) : IUserFollowService
    {
        private readonly ApplicationDbContext _dbContext = dbContext;
        private readonly IMapper _mapper = mapper;
        private readonly IRepository<UserFollow, string> _repository = repository;
        private readonly IUserContext _userContext = userContext;
        private readonly IBackgroundJobClient _backgroundJobClient = backgroundJobClient;
        private readonly ISocialGuardService _socialGuardService = socialGuardService;

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

                var followAccess = await _socialGuardService.CanFollowProfile(createUserFollow.FollowingProfileId);
                if (!followAccess.Result)
                {
                    returnResult.Message = followAccess.Message ?? ResponseMessage.NO_PERMISSION_TO_FOLLOW;
                    return returnResult;
                }

                var existingFollowingProfile = await _dbContext.Profiles.Where(x => x.Id == createUserFollow.FollowingProfileId)
                                                                        .AsNoTracking()
                                                                        .FirstOrDefaultAsync();
                if (existingFollowingProfile == null)
                {
                    returnResult.Message = ResponseMessage.PROFILE_NOT_AVAILABLE;
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
                        var selectFollowRequest = _mapper.Map<SelectFollowRequest>(followRequest);
                        returnResult.Result = selectFollowRequest;

                        // Publish FOLLOW_REQUEST notification
                        var actor = await GetProfileSnapshot(_userContext.ProfileId);
                        var notificationEvent = new NotiicationCreatedEntityDTO
                        {
                            EventType = NotificationEventType.FOLLOW_REQUEST,
                            ActorType = ActorType.Profile,
                            ActorId = _userContext.ProfileId,
                            ActorName = actor.Name,
                            ActorAvatarUrl = actor.AvatarUrl,
                            RecipientId = createUserFollow.FollowingProfileId,
                            EntityType = NotificationEntityType.PROFILE,
                            EntityId = "profile_requests",
                            EntityTitle = selectFollowRequest.RequesterProfile?.FullName,
                            EntityPreview = null,
                            ActionUrl = null,
                            Timestamp = DateTime.UtcNow
                        };

                        if (!await _socialGuardService.IsBlockedRelation(_userContext.ProfileId, createUserFollow.FollowingProfileId))
                        {
                            _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                                x => x.PublicNotification(notificationEvent, "notifications.follow"));
                        }
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
                        var selectUserFollow = _mapper.Map<SelectUserFollow>(userFollow);
                        returnResult.Result = selectUserFollow;

                        // Publish FOLLOW_USER notification
                        var actor = await GetProfileSnapshot(_userContext.ProfileId);
                        var notificationEvent = new NotiicationCreatedEntityDTO
                        {
                            EventType = NotificationEventType.FOLLOW_USER,
                            ActorType = ActorType.Profile,
                            ActorId = _userContext.ProfileId,
                            ActorName = actor.Name,
                            ActorAvatarUrl = actor.AvatarUrl,
                            RecipientId = createUserFollow.FollowingProfileId,
                            EntityType = NotificationEntityType.PROFILE,
                            EntityId = "profile_followers",
                            EntityTitle = selectUserFollow.Owner?.FullName,
                            EntityPreview = null,
                            ActionUrl = null,
                            Timestamp = DateTime.UtcNow
                        };

                        if (!await _socialGuardService.IsBlockedRelation(_userContext.ProfileId, createUserFollow.FollowingProfileId))
                        {
                            _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                                x => x.PublicNotification(notificationEvent, "notifications.follow"));
                        }

                        //Send this over to rabbitmq 
                        _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                                x => x.PublishEntity(_mapper.Map<UserFollowPublishDTO>(userFollow), MessageBusEnum.Create, MessageBusEntityEnum.UserFollow));
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
                                                .Where(x => !_dbContext.ProfileBlocks.Any(b =>
                                                    (b.OwnerId == _userContext.ProfileId && b.BlockedProfileId == x.OwnerId) ||
                                                    (b.OwnerId == x.OwnerId && b.BlockedProfileId == _userContext.ProfileId)))
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
                                                .Where(x => !_dbContext.ProfileBlocks.Any(b =>
                                                    (b.OwnerId == _userContext.ProfileId && b.BlockedProfileId == x.FollowingProfileId) ||
                                                    (b.OwnerId == x.FollowingProfileId && b.BlockedProfileId == _userContext.ProfileId)))
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

                    //Send this over to rabbitmq 
                    _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                            x => x.PublishEntity(_mapper.Map<UserFollowPublishDTO>(existingFollow), MessageBusEnum.Delete, MessageBusEntityEnum.UserFollow));
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

                    //Send this over to rabbitmq 
                    _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                            x => x.PublishEntity(_mapper.Map<List<UserFollowPublishDTO>>(follows), MessageBusEnum.BulkDelete, MessageBusEntityEnum.UserFollow));
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

        public async Task<ReturnResult<PagedData<SelectUserFollow, string>>> GetFollowersByProfileId(string profileId, Page<string> page)
        {
            ReturnResult<PagedData<SelectUserFollow, string>> returnResult = new();
            try
            {
                var basicAccess = await _socialGuardService.CanAccessProfileBasicInfo(profileId);
                if (!basicAccess.Result)
                {
                    returnResult.Message = basicAccess.Message ?? ResponseMessage.PROFILE_NOT_AVAILABLE;
                    return returnResult;
                }

                var profile = await _dbContext.Profiles
                    .Where(x => x.Id == profileId)
                    .AsNoTracking()
                    .FirstOrDefaultAsync();

                if (profile == null)
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_FOUND, "profile", profileId);
                    return returnResult;
                }

                var isOwner = _userContext.ProfileId == profileId;
                if (profile.IsPrivate && !isOwner)
                {
                    var isFollowing = await _dbContext.UserFollows
                        .AnyAsync(x => x.OwnerId == _userContext.ProfileId && x.FollowingProfileId == profileId);
                    if (!isFollowing)
                    {
                        returnResult.Message = "You do not have permission to view this profile's followers.";
                        return returnResult;
                    }
                }

                var query = _dbContext.UserFollows.Where(x => x.FollowingProfileId == profileId)
                                                .Where(x => !_dbContext.ProfileBlocks.Any(b =>
                                                    (b.OwnerId == _userContext.ProfileId && b.BlockedProfileId == x.OwnerId) ||
                                                    (b.OwnerId == x.OwnerId && b.BlockedProfileId == _userContext.ProfileId)))
                                                .AsNoTracking()
                                                .Include(x => x.Owner)
                                                .AsQueryable();
                returnResult.Result = await _repository.GetPagingAsync<Page<string>, SelectUserFollow>(query, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error fetching followers by profileId: {ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        public async Task<ReturnResult<PagedData<SelectUserFollow, string>>> GetFollowingsByProfileId(string profileId, Page<string> page)
        {
            ReturnResult<PagedData<SelectUserFollow, string>> returnResult = new();
            try
            {
                var basicAccess = await _socialGuardService.CanAccessProfileBasicInfo(profileId);
                if (!basicAccess.Result)
                {
                    returnResult.Message = basicAccess.Message ?? ResponseMessage.PROFILE_NOT_AVAILABLE;
                    return returnResult;
                }

                var profile = await _dbContext.Profiles
                    .Where(x => x.Id == profileId)
                    .AsNoTracking()
                    .FirstOrDefaultAsync();

                if (profile == null)
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_FOUND, "profile", profileId);
                    return returnResult;
                }

                var isOwner = _userContext.ProfileId == profileId;
                if (profile.IsPrivate && !isOwner)
                {
                    var isFollowing = await _dbContext.UserFollows
                        .AnyAsync(x => x.OwnerId == _userContext.ProfileId && x.FollowingProfileId == profileId);
                    if (!isFollowing)
                    {
                        returnResult.Message = "You do not have permission to view this profile's followings.";
                        return returnResult;
                    }
                }

                var query = _dbContext.UserFollows.Where(x => x.OwnerId == profileId)
                                                .Where(x => !_dbContext.ProfileBlocks.Any(b =>
                                                    (b.OwnerId == _userContext.ProfileId && b.BlockedProfileId == x.FollowingProfileId) ||
                                                    (b.OwnerId == x.FollowingProfileId && b.BlockedProfileId == _userContext.ProfileId)))
                                                .AsNoTracking()
                                                .Include(x => x.FollowingProfile)
                                                .AsQueryable();
                returnResult.Result = await _repository.GetPagingAsync<Page<string>, SelectUserFollow>(query, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error fetching followings by profileId: {ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        private async Task<(string? Name, string? AvatarUrl)> GetProfileSnapshot(string profileId)
        {
            var profile = await _dbContext.Profiles
                .Where(p => p.Id == profileId)
                .Select(p => new { p.FullName, p.AvatarUrl })
                .FirstOrDefaultAsync();

            return (profile?.FullName, profile?.AvatarUrl);
        }

    }
}
