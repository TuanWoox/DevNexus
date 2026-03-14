using Hangfire;
using Hangfire.PostgreSql;
using HangfireBasicAuthenticationFilter;
using Microsoft.AspNetCore.Builder;

namespace background_job_worker.Infrastructures
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

            // Add Hangfire Server
            services.AddHangfireServer(options =>
            {
                options.WorkerCount = 3;
                options.ServerTimeout = TimeSpan.FromMinutes(5);
                options.ShutdownTimeout = TimeSpan.FromMinutes(5);
                options.ServerName = $"Hangfire.Server.{Environment.MachineName}";
                options.Queues = new[] { "default" };
                options.SchedulePollingInterval = TimeSpan.FromMilliseconds(500); // Check every 500ms
            });

            return services;
        }

        //Extend method for application builder to use dashboard
        public static IApplicationBuilder AddHangfireDashBoardSetup(this IApplicationBuilder app, IConfiguration configuration)
        {
            app.UseHangfireDashboard("/backgroundjobs/hangfire", new DashboardOptions
            {
                Authorization = new[]
                {
                    new HangfireCustomBasicAuthenticationFilter
                    {
                         User = configuration["AccountToAccessHangfireDashboard:User"],
                         Pass = configuration["AccountToAccessHangfireDashboard:Password"]
                    }
                }
            });

            return app;
        }
    }
}