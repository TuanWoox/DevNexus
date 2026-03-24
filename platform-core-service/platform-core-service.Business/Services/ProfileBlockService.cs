using AutoMapper;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Helper;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.ProfileBlock;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Interfaces.BackgroundJobs;

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

                _backgroundJobClient.Enqueue<IProfileBlockBackgroundJobs>(x => x.DeleteFollowRequestAndUserFollow(_userContext.ProfileId, createProfileBlock.BlockedProfileId));

                var profileBlock = _mapper.Map<ProfileBlock>(createProfileBlock);
                profileBlock.OwnerId = _userContext.ProfileId;
                await _dbContext.ProfileBlocks.AddAsync(profileBlock);
                var savedResult = await _dbContext.SaveChangesAsync();
                if (savedResult > 0)
                {
                    returnResult.Result = _mapper.Map<SelectProfileBlock>(profileBlock);
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
    }
}