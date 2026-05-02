using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Attributes;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;

namespace platform_core_service.Middlewares
{
    public class RequireProfileMiddleware
    {
        private readonly RequestDelegate _next;

        private static readonly string[] _exemptPrefixes = new[]
        {
            "/api/accounts",
        };

        public RequireProfileMiddleware(RequestDelegate next) => _next = next;

        public async Task InvokeAsync(HttpContext context)
        {
            bool isExemptByPrefix = _exemptPrefixes.Any(p =>
                context.Request.Path.Value?.ToLower().StartsWith(p) == true);

            bool isExemptByAttr = context.GetEndpoint()
                ?.Metadata
                .GetMetadata<AllowWithoutProfileAttribute>() != null;

            bool isAuthenticated = context.User.Identity?.IsAuthenticated == true;

            if (!isExemptByPrefix && !isExemptByAttr && isAuthenticated)
            {
                var userId = context.User.GetUserId();
                if (!string.IsNullOrEmpty(userId))
                {
                    var dbContext = context.RequestServices.GetRequiredService<ApplicationDbContext>();
                    var profile = await dbContext.Profiles
                        .AsNoTracking()
                        .FirstOrDefaultAsync(p => p.ApplicationUserId == userId);

                    if (profile?.IsSuspended == true &&
                        (profile.SuspendedUntil == null || profile.SuspendedUntil > DateTimeOffset.UtcNow))
                    {
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        await context.Response.WriteAsJsonAsync(new
                        {
                            message = "Your account has been suspended.",
                            suspendedUntil = profile.SuspendedUntil
                        });
                        return;
                    }
                }

                bool isDeveloper = context.User.IsInRole(RoleEnum.Developer.ToString());

                if (isDeveloper)
                {
                    var profileClaim = context.User.Claims.FirstOrDefault(c => c.Type == "profileId");
                    if (profileClaim == null || string.IsNullOrEmpty(profileClaim.Value))
                    {
                        context.Response.StatusCode = 200;
                        await context.Response.WriteAsJsonAsync(new
                        {
                            message = "Please complete your profile before accessing this resource.",
                        });
                        return;
                    }
                }
            }

            await _next(context);
        }
    }
}