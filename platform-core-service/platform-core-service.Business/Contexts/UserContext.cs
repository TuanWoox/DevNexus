using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service.Business.Contexts
{
    public class UserContext(IHttpContextAccessor httpContextAccessor) : IUserContext
    {
        private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;

        public string UserId => _httpContextAccessor.HttpContext?.User?.GetUserId() ?? "";
        public bool IsAdmin => _httpContextAccessor.HttpContext?.User?.IsInRole(RoleEnum.Admin.ToString()) ?? false;
        public string UserName => _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Name)?.Value ?? "";
        public string Email => _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Email)?.Value ?? "";
        public string ProfileId => _httpContextAccessor.HttpContext?.User?.FindFirst("profileId")?.Value ?? "";
    }
}