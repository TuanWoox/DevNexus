using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Data;
using platform_core_service.Common.Utils.Extensions;

namespace platform_core_service
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            try
            {
                DevNexusLogger.Instance.Debug("Server Started");

                var webHost = CreateHostBuilder(args).Build();

                //Create a new scope
                using (var scope = webHost.Services.CreateScope())
                {
                    var myDbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    await myDbContext.Database.MigrateAsync();
                }

                await webHost.RunAsync();
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);

                DevNexusLogger.Instance.Debug("Wait 10s to reconnect");

                Thread.Sleep(10000);
                await Main(args);
            }
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                });
    }
}
