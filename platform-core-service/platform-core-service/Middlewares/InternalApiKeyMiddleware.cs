using platform_core_service.Common.Models.DTOs.HelperDTO;
using System.Text.Json;

namespace platform_core_service.Middlewares
{
    /// <summary>
    /// Guards all routes under /internal/ with a shared API key.
    /// The AI Worker must include the header: X-Internal-Api-Key: {key}
    /// Key is configured via InternalApi:AiWorkerKey in appsettings.
    /// </summary>
    public class InternalApiKeyMiddleware
    {
        private const string HEADER_NAME = "X-Internal-Api-Key";
        private const string INTERNAL_ROUTE_PREFIX = "/internal/";

        private readonly RequestDelegate _next;
        private readonly string _expectedKey;

        public InternalApiKeyMiddleware(RequestDelegate next, IConfiguration configuration)
        {
            _next = next;
            _expectedKey = configuration["InternalApi:AiWorkerKey"]
                ?? throw new InvalidOperationException(
                    "InternalApi:AiWorkerKey is not configured in appsettings.");
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Only intercept /internal/* routes
            if (!context.Request.Path.StartsWithSegments(INTERNAL_ROUTE_PREFIX,
                StringComparison.OrdinalIgnoreCase))
            {
                await _next(context);
                return;
            }

            // Check header presence
            if (!context.Request.Headers.TryGetValue(HEADER_NAME, out var receivedKey))
            {
                await WriteUnauthorizedAsync(context, "Missing X-Internal-Api-Key header.");
                return;
            }

            // Constant-time comparison to prevent timing attacks
            if (!string.Equals(receivedKey, _expectedKey, StringComparison.Ordinal))
            {
                await WriteUnauthorizedAsync(context, "Invalid internal API key.");
                return;
            }

            await _next(context);
        }

        private static async Task WriteUnauthorizedAsync(HttpContext context, string message)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";

            var result = new ReturnResult<object>
            {
                Result = null!,
                Message = message
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(result));
        }
    }
}
