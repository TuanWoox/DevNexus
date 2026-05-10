using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace platform_core_service.Common.Attributes
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class ApiKeyAuthAttribute : Attribute, IAuthorizationFilter
    {
        private const string API_KEY_HEADER = "X-Microservice-Api-Key";

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            // Check if API key header exists
            if (!context.HttpContext.Request.Headers.TryGetValue(API_KEY_HEADER, out var extractedApiKey))
            {
                context.Result = new UnauthorizedObjectResult("API Key is missing");
                return;
            }

            // Get configured API key from appsettings
            var configuration = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
            var apiKey = configuration["MicroserviceApiKey"];

            // Validate the key
            if (string.IsNullOrWhiteSpace(apiKey) ||
                !string.Equals(apiKey, extractedApiKey, StringComparison.Ordinal))
            {
                context.Result = new UnauthorizedObjectResult("Invalid API Key");
            }
        }
    }
}