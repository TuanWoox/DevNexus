using AutoMapper;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Helper;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.ProfileCommunityBlock;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class ProfileCommunityBlockService(
        ApplicationDbContext dbContext,
        IRepository<ProfileCommunityBlock, string> repository,
        IUserContext userContext,
        IMapper mapper
    ) : IProfileCommunityBlockService
    {
        private readonly ApplicationDbContext _dbContext = dbContext;
        private readonly IRepository<ProfileCommunityBlock, string> _repository = repository;
        private readonly IUserContext _userContext = userContext;
        private readonly IMapper _mapper = mapper;

        public async Task<ReturnResult<SelectProfileCommunityBlock>> CreateAsync(CreateProfileCommunityBlock createBlock)
        {
            ReturnResult<SelectProfileCommunityBlock> returnResult = new();
            try
            {
                var myProfileId = _userContext.ProfileId;
                if (string.IsNullOrEmpty(myProfileId))
                {
                    returnResult.Message = "User profile not found";
                    return returnResult;
                }

                var community = await _dbContext.Communities
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.Id == createBlock.CommunityId);

                if (community == null)
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_FOUND, "community", createBlock.CommunityId);
                    return returnResult;
                }

                if (community.OwnerId == myProfileId)
                {
                    returnResult.Message = "You cannot block a community you own";
                    return returnResult;
                }

                var existingBlock = await _dbContext.ProfileCommunityBlocks
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.ProfileId == myProfileId && x.CommunityId == createBlock.CommunityId);

                if (existingBlock != null)
                {
                    returnResult.Message = "This community is already blocked";
                    return returnResult;
                }

                var block = _mapper.Map<ProfileCommunityBlock>(createBlock);
                block.ProfileId = myProfileId;
                await _dbContext.ProfileCommunityBlocks.AddAsync(block);

                await DeleteCommunityMemberAndRequestAsync(myProfileId, createBlock.CommunityId);

                if (await _dbContext.SaveChangesAsync() > 0)
                {
                    var savedBlock = await _dbContext.ProfileCommunityBlocks
                        .Include(x => x.Community)
                        .AsNoTracking()
                        .FirstAsync(x => x.Id == block.Id);

                    returnResult.Result = _mapper.Map<SelectProfileCommunityBlock>(savedBlock);
                }
                else returnResult.Message = "Failed to save changes. Please try again later.";
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error creating community block $${ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        private async Task DeleteCommunityMemberAndRequestAsync(string profileId, string communityId)
        {
            var existingMembers = await _dbContext.CommunityMembers
                .Where(x => x.ProfileId == profileId && x.CommunityId == communityId)
                .ToListAsync();

            var existingRequests = await _dbContext.CommunityMembershipRequests
                .Where(x => x.RequesterId == profileId && x.CommunityId == communityId)
                .ToListAsync();

            var existingModerators = await _dbContext.CommunityModerators
                .Where(x => x.ModeratorId == profileId && x.CommunityId == communityId)
                .ToListAsync();

            _dbContext.CommunityMembers.RemoveRange(existingMembers);
            _dbContext.CommunityMembershipRequests.RemoveRange(existingRequests);
            _dbContext.CommunityModerators.RemoveRange(existingModerators);
        }

        public async Task<ReturnResult<PagedData<SelectProfileCommunityBlock, string>>> GetPagingAsync(Page<string> page)
        {
            ReturnResult<PagedData<SelectProfileCommunityBlock, string>> returnResult = new();
            try
            {
                var query = _dbContext.ProfileCommunityBlocks
                    .Where(x => x.ProfileId == _userContext.ProfileId)
                    .AsNoTracking()
                    .Include(x => x.Community)
                    .AsQueryable();

                returnResult.Result = await _repository.GetPagingAsync<Page<string>, SelectProfileCommunityBlock>(query, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error fetching community blocks $${ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        public async Task<ReturnResult<bool>> DeleteById(string id)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                var existingBlock = await _dbContext.ProfileCommunityBlocks
                    .FirstOrDefaultAsync(x => x.Id == id && x.ProfileId == _userContext.ProfileId);

                if (existingBlock == null)
                {
                    returnResult.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_EXIST, "community block", id);
                    return returnResult;
                }

                _dbContext.ProfileCommunityBlocks.Remove(existingBlock);
                if (await _dbContext.SaveChangesAsync() > 0)
                    returnResult.Result = true;
                else returnResult.Message = "Failed to save changes. Please try again later.";
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error deleting community block $${ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }

        public async Task<ReturnResult<int>> DeleteByIds(List<string> ids)
        {
            ReturnResult<int> returnResult = new();
            try
            {
                var existingBlocks = await _dbContext.ProfileCommunityBlocks
                    .Where(x => ids.Contains(x.Id) && x.ProfileId == _userContext.ProfileId)
                    .ToListAsync();

                if (existingBlocks.Count == 0)
                {
                    returnResult.Message = "None of the specified community block records were found";
                    return returnResult;
                }

                _dbContext.ProfileCommunityBlocks.RemoveRange(existingBlocks);
                if (await _dbContext.SaveChangesAsync() > 0)
                    returnResult.Result = existingBlocks.Count;
                else returnResult.Message = "Failed to save changes. Please try again later.";
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Debug($"Error deleting community blocks $${ex.Message}");
                returnResult.Message = ex.Message;
            }
            return returnResult;
        }
    }
}
