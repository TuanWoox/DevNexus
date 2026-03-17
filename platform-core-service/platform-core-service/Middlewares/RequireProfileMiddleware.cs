using platform_core_service.Common.Attributes;
using platform_core_service.Common.Utils.Enums;

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
                bool isDeveloper = context.User.IsInRole(RoleEnum.Developer.ToString());

                if (isDeveloper)
                {
                    var hasProfile = context.User.Claims.Any(c => c.Type == "profileId");
                    if (!hasProfile)
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