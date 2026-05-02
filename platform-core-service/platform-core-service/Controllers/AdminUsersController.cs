using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Profile;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Controllers
{
    /// <summary>
    /// Admin-only endpoint for user/profile management.
    /// Allows admins to view users, suspend/unsuspend profiles, and update user roles.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminUsersController : ControllerBase
    {
        private readonly IAdminUserService _adminUserService;

        public AdminUsersController(IAdminUserService adminUserService)
        {
            _adminUserService = adminUserService;
        }

        /// <summary>
        /// POST api/adminusers/paging
        /// Returns paged list of profiles/users for admin management.
        /// </summary>
        [HttpPost("paging")]
        public async Task<IActionResult> GetAllUsers([FromBody] Page<string> page)
        {
            ReturnResult<PagedData<AdminProfileDTO, string>> returnResult = new();
            try
            {
                returnResult = await _adminUserService.GetAllUsersAsync(page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        /// <summary>
        /// POST api/adminusers/{id}/suspend
        /// Suspends a profile. If DaySuspend is null, suspension is indefinite.
        /// </summary>
        [HttpPost("{id}/suspend")]
        public async Task<IActionResult> SuspendUser(string id, [FromBody] AdminSuspendUserDTO dto)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                returnResult = await _adminUserService.SuspendUserAsync(id, dto);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        /// <summary>
        /// POST api/adminusers/{id}/unsuspend
        /// Clears suspension fields for a profile.
        /// </summary>
        [HttpPost("{id}/unsuspend")]
        public async Task<IActionResult> UnsuspendUser(string id)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                returnResult = await _adminUserService.UnsuspendUserAsync(id);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }

        /// <summary>
        /// PUT api/adminusers/{id}/role
        /// Updates a user's role. The route id is ApplicationUser.Id.
        /// </summary>
        [HttpPut("{id}/role")]
        public async Task<IActionResult> UpdateRole(string id, [FromBody] AdminUpdateRoleDTO dto)
        {
            ReturnResult<bool> returnResult = new();
            try
            {
                returnResult = await _adminUserService.UpdateRoleAsync(id, dto.NewRole);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                returnResult.Message = $"An error occurred: {ex.Message}";
            }
            return Ok(returnResult);
        }
    }
}
