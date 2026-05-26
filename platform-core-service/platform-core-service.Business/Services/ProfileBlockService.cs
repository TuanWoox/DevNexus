using AutoMapper;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Helper;
using platform_core_service.Common.Interfaces.BackgroundJobs;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.ProfileBlock;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.DTOs.MessageBusDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace platform_core_service.Business.Services
{
    public class ProfileBlockService
    (
        ApplicationDbContext dbContext,
        IRepository<ProfileBlock, string> repostiory,
        IUserContext userContext,
        IMapper mapper,
        IBackgroundJobClient backgroundJobClient
    ) : IProfileBlockService
    {
        private ApplicationDbContext _dbContext = dbContext;
        private IRepository<ProfileBlock, string> _repository = repostiory;
        private readonly IUserContext _userContext = userContext;
        private readonly IMapper _mapper = mapper;
        private readonly IBackgroundJobClient _backgroundJobClient = backgroundJobClient;

        public async Task<ReturnResult<SelectProfileBlock>> CreateAsync(CreateProfileBlock createProfileBlock)
        {
            ReturnResult<SelectProfileBlock> returnResult = new ReturnResult<SelectProfileBlock>();
            try
            {
                if (createProfileBlock.BlockedProfileId == _userContext.ProfileId)
                {
                    returnResult.Message = "You cannot block yourself";
                    return returnResult;
                }

                var existingProfile = await _dbContext.Profiles.Where(x => x.Id == createProfileBlock.BlockedProfileId)
                                                    .AsNoTracking()
                                                    .FirstOrDefaultAsync();
                if (existingProfile == null)
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_FOUND,
                                                        "profile", createProfileBlock.BlockedProfileId);
                    return returnResult;
                }

                var existingProfileBlock = await _dbContext.ProfileBlocks.Where(x => x.BlockedProfileId == createProfileBlock.BlockedProfileId
                                                                        && x.OwnerId == _userContext.ProfileId)
                                                                        .AsNoTracking()
                                                                        .FirstOrDefaultAsync();

                if (existingProfileBlock != null)
                {
                    returnResult.Message = "This profile is already blocked";
                    return returnResult;
                }

           

                var profileBlock = _mapper.Map<ProfileBlock>(createProfileBlock);
                profileBlock.OwnerId = _userContext.ProfileId;
                await _dbContext.ProfileBlocks.AddAsync(profileBlock);

                await DeleteFollowRequestAndUserFollow(
                    _userContext.ProfileId,
                    createProfileBlock.BlockedProfileId);

                var savedResult = await _dbContext.SaveChangesAsync();
                if (savedResult > 0)
                {
                    returnResult.Result = _mapper.Map<SelectProfileBlock>(profileBlock);

                    //Send this over to rabbitmq 
                    _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                            x => x.PublishEntity(_mapper.Map<ProfileBlockPublishDTO>(profileBlock), MessageBusEnum.Create, MessageBusEntityEnum.ProfileBlock)
               );
                }
                else returnResult.Message = "Failed to save changes. Please try again later.";
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error creating block $${ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        private async Task DeleteFollowRequestAndUserFollow(string profileId, string blockedProfileId)
        {
            var existingFollowRequests = await _dbContext.FollowRequests
                .Where(x => (x.RequesterProfileId == blockedProfileId || x.RequesterProfileId == profileId)
                         && (x.TargetProfileId == profileId || x.TargetProfileId == blockedProfileId))
                .ToListAsync();

            var existingUserFollows = await _dbContext.UserFollows
                .Where(x => (x.FollowingProfileId == blockedProfileId || x.FollowingProfileId == profileId)
                         && (x.OwnerId == profileId || x.OwnerId == blockedProfileId))
                .ToListAsync();

            _dbContext.UserFollows.RemoveRange(existingUserFollows);
            _dbContext.FollowRequests.RemoveRange(existingFollowRequests);
        }

        public async Task<ReturnResult<PagedData<SelectProfileBlock, string>>> GetPagingAsync(Page<string> page)
        {
            ReturnResult<PagedData<SelectProfileBlock, string>> returnResult = new();
            try
            {
                var query = _dbContext.ProfileBlocks.Where(x => x.OwnerId == _userContext.ProfileId)
                                                    .AsNoTracking()
                                                    .Include(x => x.BlockedProfile)
                                                    .AsQueryable();
                returnResult.Result = await _repository.GetPagingAsync<Page<string>, SelectProfileBlock>(query, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error fetching block $${ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        public async Task<ReturnResult<bool>> DeleteById(string id)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                var existingProfileBlock = await _dbContext.ProfileBlocks.Where(x => x.Id == id
                                                                                && x.OwnerId == _userContext.ProfileId)
                                                                                .FirstOrDefaultAsync();
                if (existingProfileBlock == null)
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_EXIST, "block", id);
                    return returnResult;
                }
                _dbContext.ProfileBlocks.Remove(existingProfileBlock);
                if (await _dbContext.SaveChangesAsync() > 0)
                {
                    returnResult.Result = true;

                    //Send this over to rabbitmq 
                    _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                            x => x.PublishEntity(_mapper.Map<ProfileBlockPublishDTO>(existingProfileBlock), MessageBusEnum.Delete, MessageBusEntityEnum.ProfileBlock));
                }
                else returnResult.Message = "Failed to save changes. Please try again later.";
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error deleting block $${ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        public async Task<ReturnResult<int>> DeleteByIds(List<string> ids)
        {
            ReturnResult<int> returnResult = new();
            try
            {
                var existingProfileBlocks = await _dbContext.ProfileBlocks.Where(x => ids.Contains(x.Id)
                                                                                && x.OwnerId == _userContext.ProfileId)
                                                                                .ToListAsync();
                if (existingProfileBlocks.Count == 0)
                {
                    returnResult.Message = "None of the specified block records were found";
                    return returnResult;
                }
                _dbContext.ProfileBlocks.RemoveRange(existingProfileBlocks);
                if (await _dbContext.SaveChangesAsync() > 0)
                {
                    returnResult.Result = existingProfileBlocks.Count;

                    //Send this over to rabbitmq
                    _backgroundJobClient.Enqueue<IPublishMessageBackgroundJobs>(
                            x => x.PublishEntity(_mapper.Map<List<ProfileBlock>>(existingProfileBlocks), MessageBusEnum.BulkDelete, MessageBusEntityEnum.ProfileBlock));
                }
                else returnResult.Message = "Failed to save changes. Please try again later.";
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error deleting block $${ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        // public async Task<ReturnResult<bool>> DeleteByBlockProfileIdAsync(string blockedProfileId)
        // {
        //     ReturnResult<bool> returnResult = new ReturnResult<bool>();
        //     try
        //     {
        //         var existingProfileBlock = await _dbContext.ProfileBlocks.Where(x => x.BlockedProfileId == blockedProfileId
        //                                                                         && x.OwnerId == _userContext.ProfileId)
        //                                                                         .FirstOrDefaultAsync();
        //         if (existingProfileBlock == null)
        //         {
        //             returnResult.Message = "This profile is not in your block list";
        //             return returnResult;
        //         }
        //         _dbContext.ProfileBlocks.Remove(existingProfileBlock);
        //         if (await _dbContext.SaveChangesAsync() > 0)
        //         {
        //             returnResult.Result = true;
        //         }
        //         else returnResult.Message = "Failed to save changes. Please try again later.";
        //     }
        //     catch (Exception ex)
        //     {
        //         DevNexusLogger.Instance.Debug($"Error delete block $${ex.Message}");
        //         returnResult.Message = ex.Message;
        //     }
        //     return returnResult;
        // }

        public async Task<ReturnResult<SelectBlockStatus>> GetBlockStatusAsync(string otherProfileId)
        {
            ReturnResult<SelectBlockStatus> returnResult = new();
            try
            {
                var myProfileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(myProfileId))
                {
                    returnResult.Message = "Unauthorized";
                    return returnResult;
                }

                // Check if current user has blocked the other user
                var myBlock = await _dbContext.ProfileBlocks
                    .Where(x => x.OwnerId == myProfileId && x.BlockedProfileId == otherProfileId)
                    .AsNoTracking()
                    .FirstOrDefaultAsync();

                // Check if the other user has blocked the current user
                var theirBlock = await _dbContext.ProfileBlocks
                    .Where(x => x.OwnerId == otherProfileId && x.BlockedProfileId == myProfileId)
                    .AsNoTracking()
                    .AnyAsync();

                returnResult.Result = new SelectBlockStatus
                {
                    IBlockedThem = myBlock != null,
                    BlockId = myBlock?.Id,
                    TheyBlockedMe = theirBlock
                };
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error getting block status $${ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }
    }
}
