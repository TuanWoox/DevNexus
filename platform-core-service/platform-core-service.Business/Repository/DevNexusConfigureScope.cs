using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http;

namespace platform_core_service.Business.Repositoy
{
    public static class StudyNestServiceConfiguration
    {
        public static IServiceCollection RegisterStudyNestService(this IServiceCollection services)
        {
            // Allows access to HttpContext in services via IHttpContextAccessor outside controllers
            services.AddHttpContextAccessor();
            // Allow to use httpclient as a http factory
            services.AddHttpClient();
            return services;
        }
    }
}