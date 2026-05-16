using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using platform_core_service.Business.Contexts;
using platform_core_service.Business.Helper;
using platform_core_service.Business.MessageBus;
using platform_core_service.Business.Services;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces;
using platform_core_service.Common.Interfaces.Contexts;
using platform_core_service.Common.Interfaces.Helper;
using platform_core_service.Common.Interfaces.MessageBus;
using platform_core_service.Common.Interfaces.Services;
using StackExchange.Redis;

namespace platform_core_service.Business.Repository
{
    public static class StudyNestServiceConfiguration
    {
        public static IServiceCollection RegisterStudyNestService(this IServiceCollection services, IConfiguration configuration)
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
            services.AddScoped<ISearchService, SearchService>();
            services.AddScoped<IPostService, PostService>();
            services.AddScoped<IQAPostService, QAPostService>();
            services.AddScoped<IAnswerService, AnswerService>();
            services.AddScoped<IVoteService, VoteService>();
            services.AddScoped<ICommentService, CommentService>();
            services.AddScoped<ICommunityService, CommunityService>();
            services.AddScoped<ICommunityModeratorService, CommunityModeratorService>();
            services.AddScoped<ICommunityMemberService, CommunityMemberService>();
            services.AddScoped<ICommunityMembershipRequestService, CommunityMembershipRequestService>();
            services.AddScoped<ICommunityBanService, CommunityBanService>();
            services.AddScoped<ICacheService, CacheService>();
            services.AddScoped<IProfileBlockService, ProfileBlockService>();
            services.AddScoped<IFollowRequestService, FollowRequestService>();
            services.AddScoped<IUserFollowService, UserFollowService>();
            services.AddScoped<IBookMarkService, BookMarkService>();
            services.AddScoped<IBookMarkItemService, BookMarkedItemService>();
            services.AddScoped<ISocialGuardService, SocialGuardService>();
            services.AddScoped<IProfileMediaService, ProfileMediaService>();
            services.AddScoped<ICommunityMediaService, CommunityMediaService>();
            services.AddScoped<IPostMediaService, PostMediaService>();
            services.AddScoped<IQAMediaService, QAMediaService>();
            services.AddScoped<IModerationService, ModerationService>();
            services.AddScoped<IMicroserviceSyncService, MicroserviceSyncService>();
            services.AddScoped<IAdminModerationService, AdminModerationService>();
            services.AddScoped<IAdminPostService, AdminPostService>();
            services.AddScoped<IAdminDashboardService, AdminDashboardService>();
            services.AddScoped<IAdminUserService, AdminUserService>();
            services.AddScoped<IAdminTagService, AdminTagService>();
            services.AddScoped<IAiUsageLogService, AiUsageLogService>();
            services.AddScoped<IAiContentService, AiContentService>();

            // AiWorkerClient uses IHttpClientFactory — must register with AddHttpClient
            services.AddHttpClient<IAiWorkerClient, AiWorkerClient>();
            // Register the Redis connection multiplexer as a singleton service
            // This allows the application to interact directly with Redis for advanced scenarios
            services.AddSingleton<IConnectionMultiplexer>(sp =>
            {
                var redisConfig = configuration.GetSection("RedisCacheOptions").GetValue<string>("Configuration");
                if (string.IsNullOrEmpty(redisConfig))
                    throw new InvalidOperationException("Redis configuration is missing in appsettings");

                var options = ConfigurationOptions.Parse(redisConfig);
                options.AbortOnConnectFail = false;

                return ConnectionMultiplexer.Connect(options);
            });

            return services;
        }
    }
}
