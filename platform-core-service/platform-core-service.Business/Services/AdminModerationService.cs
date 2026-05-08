using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Moderation;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class AdminModerationService : IAdminModerationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IUserContext _userContext;
        private readonly IRepository<ModerationQueueEntry, string> _queueRepository;

        public AdminModerationService(
            ApplicationDbContext context,
            IUserContext userContext,
            IRepository<ModerationQueueEntry, string> queueRepository)
        {
            _context = context;
            _userContext = userContext;
            _queueRepository = queueRepository;
        }

        public async Task<ReturnResult<PagedData<AdminQueueEntryDTO, string>>> GetPendingQueueAsync(Page<string> page)
        {
            var result = new ReturnResult<PagedData<AdminQueueEntryDTO, string>>();
            try
            {
                if (!_userContext.IsAdmin && !_userContext.IsModerator)
                {
                    result.Message = "You are not the admin/moderator";
                    return result;
                }
                // Only unresolved entries (ResolvedAt IS NULL) — i.e. waiting for human action
                var query = _context.ModerationQueueEntries
                    .Where(e => e.ResolvedAt == null)
                    .Include(e => e.Post)
                        .ThenInclude(p => p.Author)
                    .AsNoTracking()
                    .AsQueryable();

                result.Result = await _queueRepository.GetPagingAsync<Page<string>, AdminQueueEntryDTO>(query, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while retrieving moderation queue: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<bool>> ApproveAsync(AdminQueueResolveDTO dto)
        {
            var result = new ReturnResult<bool>();
            try
            {
                if (!_userContext.IsAdmin && !_userContext.IsModerator)
                {
                    result.Message = "You are not the admin/moderator";
                    return result;
                }
                var adminId = _userContext.ProfileId;
                // Step 1: Load entry with its linked post
                var entry = await _context.ModerationQueueEntries
                    .Include(e => e.Post)
                    .FirstOrDefaultAsync(e => e.Id == dto.Id);

                if (entry == null)
                {
                    result.Message = $"Queue entry {dto.Id} not found";
                    return result;
                }

                // Step 2: Guard — already resolved
                if (entry.ResolvedAt.HasValue)
                {
                    result.Message = $"Queue entry {dto.Id} is already resolved ({entry.Resolution})";
                    return result;
                }

                // Step 3: Resolve the queue entry
                entry.Resolution = "Approved";
                entry.ResolvedAt = DateTimeOffset.UtcNow;
                entry.AssignedModeratorId = adminId;

                // Step 4: Update post to Approved — makes it visible in feed
                entry.Post.ModerationStatus = ModerationStatus.Approved;

                await _context.SaveChangesAsync();

                DevNexusLogger.Instance.Debug(
                    $"[AdminModeration] Entry {dto.Id} approved by admin {adminId} for post {entry.PostId}");

                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while approving queue entry: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<bool>> RejectAsync(AdminQueueResolveDTO dto)
        {
            var result = new ReturnResult<bool>();
            try
            {
                if (!_userContext.IsAdmin && !_userContext.IsModerator)
                {
                    result.Message = "You are not the admin/moderator";
                    return result;
                }
                var adminId = _userContext.ProfileId;
                // Step 1: Load entry with its linked post
                var entry = await _context.ModerationQueueEntries
                    .Include(e => e.Post)
                    .FirstOrDefaultAsync(e => e.Id == dto.Id);

                if (entry == null)
                {
                    result.Message = $"Queue entry {dto.Id} not found";
                    return result;
                }

                // Step 2: Guard — already resolved
                if (entry.ResolvedAt.HasValue)
                {
                    result.Message = $"Queue entry {dto.Id} is already resolved ({entry.Resolution})";
                    return result;
                }

                // Step 3: Resolve the queue entry
                entry.Resolution = "Rejected";
                entry.ResolvedAt = DateTimeOffset.UtcNow;
                entry.AssignedModeratorId = adminId;

                // Step 4: Update post to Flagged — keeps it hidden from feed
                entry.Post.ModerationStatus = ModerationStatus.Flagged;

                await _context.SaveChangesAsync();

                DevNexusLogger.Instance.Debug(
                    $"[AdminModeration] Entry {dto.Id} rejected by admin {adminId} for post {entry.PostId}");

                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while rejecting queue entry: {ex.Message}";
            }
            return result;
        }
    }
}
