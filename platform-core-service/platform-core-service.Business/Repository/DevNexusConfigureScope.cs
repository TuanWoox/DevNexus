using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http;
using platform_core_service.Business.Contexts;
using platform_core_service.Business.Services;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Services;

namespace platform_core_service.Business.Repository
{
    public static class StudyNestServiceConfiguration
    {
        public static IServiceCollection RegisterStudyNestService(this IServiceCollection services)
        {
            services.AddScoped(typeof(IRepository<,>), typeof(Repository<,>));
            // Allows access to HttpContext in services via IHttpContextAccessor outside controllers
            services.AddHttpContextAccessor();
            // Allow to use httpclient as a http factory
            services.AddHttpClient();
            services.AddScoped<ITokenService, TokenService>();
            services.AddScoped<IAccountService, AccountService>();
            services.AddScoped<IIdentityService, IdentityService>();
            services.AddScoped<IUserContext, UserContext>();
            services.AddScoped<IConfigurationService, ConfigurationService>();
            services.AddScoped<IProfileService, ProfileService>();
            services.AddScoped<IPostService, PostService>();
            services.AddScoped<IQAPostService, QAPostService>();
            services.AddScoped<IAnswerService, AnswerService>();
            services.AddScoped<IVoteService, VoteService>();
            return services;
        }
    }
}