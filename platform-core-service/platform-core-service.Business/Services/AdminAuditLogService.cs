using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Admin;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class AdminAuditLogService : IAdminAuditLogService
    {
        private readonly ApplicationDbContext _context;
        private readonly IRepository<AdminAuditLog, string> _repository;
        private readonly IUserContext _userContext;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AdminAuditLogService(
            ApplicationDbContext context,
            IRepository<AdminAuditLog, string> repository,
            IUserContext userContext,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _repository = repository;
            _userContext = userContext;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task AddAsync(CreateAdminAuditLogDTO dto, CancellationToken cancellationToken = default)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.TargetId))
            {
                return;
            }

            var actorDisplayName = await ResolveActorDisplayNameAsync(cancellationToken);
            var httpContext = _httpContextAccessor.HttpContext;
            var userAgent = httpContext?.Request.Headers.UserAgent.ToString();

            var log = new AdminAuditLog
            {
                ActorId = EmptyToNull(_userContext.ProfileId),
                ActorUserId = EmptyToNull(_userContext.UserId),
                ActorDisplayName = actorDisplayName,
                ActorRole = ResolveActorRole(),
                TargetType = dto.TargetType,
                TargetId = dto.TargetId,
                TargetDisplayName = Truncate(dto.TargetDisplayName, 500),
                ActionType = dto.ActionType,
                OldState = Truncate(dto.OldState, 4000),
                NewState = Truncate(dto.NewState, 4000),
                PublicReason = Truncate(dto.PublicReason, 1000),
                InternalNote = Truncate(dto.InternalNote, 500),
                MetadataJson = Truncate(dto.MetadataJson, 4000),
                IpAddress = Truncate(httpContext?.Connection.RemoteIpAddress?.ToString(), 64),
                UserAgent = Truncate(string.IsNullOrWhiteSpace(userAgent) ? null : userAgent, 512),
                CreatedAt = DateTimeOffset.UtcNow
            };

            await _context.AdminAuditLogs.AddAsync(log, cancellationToken);
        }

        public async Task<ReturnResult<PagedData<AdminAuditLogDTO, string>>> GetPagingAsync(Page<string> page)
        {
            var result = new ReturnResult<PagedData<AdminAuditLogDTO, string>>();
            try
            {
                page ??= new Page<string>();
                page.Size = page.Size == 0 ? 20 : Math.Clamp(page.Size, 1, 100);
                page.PageNumber = Math.Max(page.PageNumber, 0);

                var query = _context.AdminAuditLogs
                    .AsNoTracking()
                    .OrderByDescending(log => log.CreatedAt)
                    .AsQueryable();

                result.Result = await _repository.GetPagingAsync<Page<string>, AdminAuditLogDTO>(query, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while retrieving audit logs: {ex.Message}";
            }

            return result;
        }

        private async Task<string?> ResolveActorDisplayNameAsync(CancellationToken cancellationToken)
        {
            var profileId = EmptyToNull(_userContext.ProfileId);
            if (profileId != null)
            {
                var profileName = await _context.Profiles
                    .AsNoTracking()
                    .Where(p => p.Id == profileId)
                    .Select(p => p.FullName)
                    .FirstOrDefaultAsync(cancellationToken);

                if (!string.IsNullOrWhiteSpace(profileName))
                {
                    return profileName;
                }
            }

            return EmptyToNull(_userContext.UserName) ?? EmptyToNull(_userContext.Email);
        }

        private string? ResolveActorRole()
        {
            if (_userContext.IsAdmin) return "Admin";
            if (_userContext.IsModerator) return "Moderator";
            return null;
        }

        private static string? EmptyToNull(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? null : value;
        }

        private static string? Truncate(string? value, int maxLength)
        {
            return value == null || value.Length <= maxLength ? value : value[..maxLength];
        }
    }
}
