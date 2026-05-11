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
        public bool IsAdmin => _httpContextAccessor.HttpContext?.User?.IsAdminRole() ?? false;
        public bool IsModerator => _httpContextAccessor.HttpContext?.User?.IsModeratorRole() ?? false;
        public string UserName => _httpContextAccessor.HttpContext?.User?.GetUserName() ?? "";
        public string Email => _httpContextAccessor.HttpContext?.User?.GetUserEmail() ?? "";
        public string ProfileId => _httpContextAccessor.HttpContext?.User?.GetProfileId() ?? "";
    }
}