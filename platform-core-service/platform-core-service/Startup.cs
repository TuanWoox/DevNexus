using platform_core_service.Business.Repository;
using platform_core_service.Configuration;
using platform_core_service.Data;

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
            services.ConfigureCorsDomain(Configuration, _env);
            services.AddSwaggerGen();
            services.ConfigureAuthService(Configuration);
            services.ConfigurePostgresqlDatabase(Configuration);
            services.ConfigureIdentity();
            services.ConfigureSignalR();
            services.ConfigureAutoMapper();
            services.RegisterStudyNestService();

        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {

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
            app.UseAuthorization();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });

            PrepDb.SeedData(app).GetAwaiter().GetResult();
        }
    }
}
