using platform_core_service.Business.Repository;
using platform_core_service.Data;
using platform_core_service.Infrastructures.Hangfire;
using platform_core_service.Infrastructures.Service;
using platform_core_service.Middlewares;

namespace platform_core_service
{
    public class Startup
    {
        public Startup(IConfiguration configuration, IWebHostEnvironment env)
        {
            Configuration = configuration;
            _env = env;
        }

        public IConfiguration Configuration { get; }

        private IWebHostEnvironment _env;

        public void ConfigureServices(IServiceCollection services)
        {
            services.ConfigureControllerWithNewtonsoftJson();
            services.ConfigureInvalidModelState();
            services.ConfigureCorsDomain(Configuration, _env);
            services.ConfigureSwaggerService();
            services.ConfigureAuthService(Configuration);
            services.ConfigurePostgresqlDatabase(Configuration);
            services.ConfigureIdentity();
            services.ConfigureSignalR();
            services.ConfigureAutoMapper();
            services.ConfigureHangfireWithPostgreSql(Configuration);
            services.RegisterStudyNestService();
            services.AddDistributedMemoryCache();
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            // Add global exception middleware
            app.UseMiddleware<GlobalExceptionMiddleware>();

            #region  Development Configuration
            if (env.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI(options =>
                {
                    options.ConfigObject.AdditionalItems.Add("persistAuthorization", "true");
                });
            }
            #endregion

            app.UseCors("CorsPolicy");
            app.UseHttpsRedirection();
            app.UseRouting();
            app.UseAuthentication();
            app.UseAuthorization();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });

            PrepDb.SeedData(app).GetAwaiter().GetResult();
        }
    }
}
