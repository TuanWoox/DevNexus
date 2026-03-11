using Hangfire;
using Hangfire.PostgreSql;

namespace platform_core_service.Infrastructures.Hangfire
{
    public static class HangfireSetupExtension
    {
        // Extend method for services to add hangfire services and hangfire server
        public static IServiceCollection ConfigureHangfireWithPostgreSql(this IServiceCollection services, IConfiguration config)
        {
            services.AddHangfire(configuration => configuration
                .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
                .UseSimpleAssemblyNameTypeSerializer()
                .UseRecommendedSerializerSettings()
                .UsePostgreSqlStorage(options =>
                {
                    options.UseNpgsqlConnection(config.GetConnectionString("HangfireConnection"));
                },
                new PostgreSqlStorageOptions
                {
                    PrepareSchemaIfNecessary = true,
                    SchemaName = "hangfire"
                }));

            return services;
        }
    }
}