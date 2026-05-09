using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Entities.Identities;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Profile;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using ProfileEntity = platform_core_service.Common.Entities.DbEntities.Profile;


namespace platform_core_service.Business.Services
{
    public class AdminUserService : IAdminUserService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly IUserContext _userContext;
        private readonly IMapper _mapper;
        private readonly IRepository<ProfileEntity, string> _repository;

        public AdminUserService(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            RoleManager<ApplicationRole> roleManager,
            IUserContext userContext,
            IMapper mapper,
            IRepository<ProfileEntity, string> repository)
        {
            _context = context;
            _userManager = userManager;
            _roleManager = roleManager;
            _userContext = userContext;
            _mapper = mapper;
            _repository = repository;
        }

        public async Task<ReturnResult<PagedData<AdminProfileDTO, string>>> GetAllUsersAsync(Page<string> page)
        {
            var result = new ReturnResult<PagedData<AdminProfileDTO, string>>();
            try
            {
                // 1. Build the base query with necessary Includes
                var query = _context.Profiles
                    .Include(p => p.Posts)
                    .Include(p => p.ApplicationUser)
                        .ThenInclude(u => u.UserRoles)
                            .ThenInclude(ur => ur.Role)
                    .AsNoTracking()
                    .AsQueryable();

                result.Result = await _repository.GetPagingAsync<Page<string>, AdminProfileDTO>(query, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while retrieving users: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<bool>> SuspendUserAsync(string profileId, AdminSuspendUserDTO dto)
        {
            var result = new ReturnResult<bool>();
            try
            {
                if (dto?.DaySuspend <= 0)
                {
                    result.Result = false;
                    result.Message = "DaySuspend must be greater than 0, or null for indefinite suspension.";
                    return result;
                }

                DateTimeOffset? until = dto?.DaySuspend == null
                    ? null
                    : DateTimeOffset.UtcNow.AddDays(dto.DaySuspend.Value);

                var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.Id == profileId);
                if (profile == null)
                {
                    result.Message = $"Profile {profileId} not found";
                    return result;
                }

                if (profile.Id == _userContext.ProfileId || profile.ApplicationUserId == _userContext.UserId)
                {
                    result.Message = "Admins cannot suspend themselves";
                    return result;
                }

                profile.IsSuspended = true;
                profile.SuspendedUntil = until;

                await _context.SaveChangesAsync();
                DevNexusLogger.Instance.Debug($"[AdminUser] Profile {profileId} suspended");
                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while suspending user: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<bool>> UnsuspendUserAsync(string profileId)
        {
            var result = new ReturnResult<bool>();
            try
            {
                var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.Id == profileId);
                if (profile == null)
                {
                    result.Message = $"Profile {profileId} not found";
                    return result;
                }

                profile.IsSuspended = false;
                profile.SuspendedUntil = null;

                await _context.SaveChangesAsync();
                DevNexusLogger.Instance.Debug($"[AdminUser] Profile {profileId} unsuspended");
                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while unsuspending user: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<bool>> UpdateRoleAsync(string userId, string newRole)
        {
            var result = new ReturnResult<bool>();
            try
            {
                if (!_userContext.IsAdmin)
                {
                    result.Message = "Only Admins can change user roles";
                    return result;
                }

                if (userId == _userContext.UserId)
                {
                    result.Message = "Admins cannot change their own role";
                    return result;
                }

                if (string.IsNullOrWhiteSpace(newRole))
                {
                    result.Message = "New role is required";
                    return result;
                }

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    result.Message = $"User {userId} not found";
                    return result;
                }

                var roleExists = await _roleManager.RoleExistsAsync(newRole);
                if (!roleExists)
                {
                    result.Message = $"Role {newRole} not found";
                    return result;
                }

                var currentRoles = await _userManager.GetRolesAsync(user);
                if (currentRoles.Count > 0)
                {
                    var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
                    if (!removeResult.Succeeded)
                    {
                        result.Message = string.Join("; ", removeResult.Errors.Select(e => e.Description));
                        return result;
                    }
                }

                var addResult = await _userManager.AddToRoleAsync(user, newRole);
                if (!addResult.Succeeded)
                {
                    result.Message = string.Join("; ", addResult.Errors.Select(e => e.Description));
                    return result;
                }

                DevNexusLogger.Instance.Debug($"[AdminUser] User {userId} role changed to {newRole}");
                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while updating role: {ex.Message}";
            }
            return result;
        }
    }
}
