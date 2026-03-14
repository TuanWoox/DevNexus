using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Utils.Extensions;
using shared_contracts.Models.DTOs.HelperDTO;
using System.Net;
using System.Text.Json;

namespace platform_core_service.Middlewares
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;

        public GlobalExceptionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error($"Global Exception: {ex}");
                await HandleExceptionAsync(context, ex);
            }
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            var result = new ReturnResult<object>
            {
                Result = default!,
                Message = $"An error occurred: {exception.Message}"
            };

            var jsonResult = JsonSerializer.Serialize(result);
            return context.Response.WriteAsync(jsonResult);
        }
    }
}
