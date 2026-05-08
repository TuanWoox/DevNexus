using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.DTOs.MicroserviceSyncDTO;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class MicroserviceSyncService : IMicroserviceSyncService
    {
        private readonly ApplicationDbContext _context;
        private readonly IRepository<Profile, string> _profileRepository;
        private readonly IRepository<ProfileBlock, string> _profileBlockRepository;
        private readonly IRepository<UserFollow, string> _userFollowRepository;

        public MicroserviceSyncService(
            ApplicationDbContext context,
            IRepository<Profile, string> profileRepository,
            IRepository<ProfileBlock, string> profileBlockRepository,
            IRepository<UserFollow, string> userFollowRepository)
        {
            _context = context;
            _profileRepository = profileRepository;
            _profileBlockRepository = profileBlockRepository;
            _userFollowRepository = userFollowRepository;
        }

        // ✅ COUNT - only non-deleted profiles
        public async Task<ReturnResult<int>> GetProfilesCountAsync()
        {
            var returnResult = new ReturnResult<int>();
            try
            {
                var count = await _context.Profiles
                    .Where(p => !p.Deleted)
                    .CountAsync();

                returnResult.Result = count;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return returnResult;
        }

        // ✅ PAGING - filters OUT IDs in page.Selected
        public async Task<ReturnResult<PagedData<ProfileSyncDTO, string>>> GetProfilesSnapshotAsync(Page<string> page)
        {
            var returnResult = new ReturnResult<PagedData<ProfileSyncDTO, string>>();
            try
            {
                page.Size = Math.Min(page.Size, 500);

                // Build query - only non-deleted profiles
                var query = _context.Profiles.Where(p => page.Selected == null || page.Selected.Count == 0 || !page.Selected.Contains(p.Id))
                                            .OrderBy(p => p.DateCreated)
                                            .AsQueryable();

                var pagedData = await _profileRepository.GetPagingAsync<Page<string>, ProfileSyncDTO>(query, page);

                returnResult.Result = pagedData;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return returnResult;
        }

        public async Task<ReturnResult<int>> GetProfileBlocksCountAsync()
        {
            var returnResult = new ReturnResult<int>();
            try
            {
                var count = await _context.ProfileBlocks.CountAsync();
                returnResult.Result = count;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return returnResult;
        }

        public async Task<ReturnResult<PagedData<ProfileBlockSyncDTO, string>>> GetProfileBlocksSnapshotAsync(Page<string> page)
        {
            var returnResult = new ReturnResult<PagedData<ProfileBlockSyncDTO, string>>();
            try
            {
                page.Size = Math.Min(page.Size, 500);

                var query = _context.ProfileBlocks.AsQueryable();

                if (page.Selected != null && page.Selected.Count > 0)
                {
                    query = query.Where(pb => !page.Selected.Contains(pb.Id));
                }

                query = query.OrderBy(pb => pb.DateCreated);

                var pagedData = await _profileBlockRepository.GetPagingAsync<Page<string>, ProfileBlockSyncDTO>(query, page);

                returnResult.Result = pagedData;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return returnResult;
        }

        public async Task<ReturnResult<int>> GetUserFollowsCountAsync()
        {
            var returnResult = new ReturnResult<int>();
            try
            {
                var count = await _context.UserFollows.CountAsync();
                returnResult.Result = count;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return returnResult;
        }

        public async Task<ReturnResult<PagedData<UserFollowSyncDTO, string>>> GetUserFollowsSnapshotAsync(Page<string> page)
        {
            var returnResult = new ReturnResult<PagedData<UserFollowSyncDTO, string>>();
            try
            {
                page.Size = Math.Min(page.Size, 500);

                var query = _context.UserFollows.AsQueryable();

                if (page.Selected != null && page.Selected.Count > 0)
                {
                    query = query.Where(uf => !page.Selected.Contains(uf.Id));
                }

                query = query.OrderBy(uf => uf.DateCreated);

                var pagedData = await _userFollowRepository.GetPagingAsync<Page<string>, UserFollowSyncDTO>(query, page);

                returnResult.Result = pagedData;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return returnResult;
        }
    }
}
