using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using platform_core_service.Common.Interfaces.Services;

namespace platform_core_service.Data
{
    public static class PrepDb
    {
        public static async Task<Task> SeedData(IApplicationBuilder appBuilder)
        {
            using (var scope = appBuilder.ApplicationServices.CreateScope())
            {
                var identityService = scope.ServiceProvider.GetRequiredService<IIdentityService>();
                var configuration = scope.ServiceProvider.GetRequiredService<IConfigurationService>();
                var accountService = scope.ServiceProvider.GetRequiredService<IAccountService>();
                await identityService.InitRole();
                await configuration.InitSetting();
                await accountService.InitUser();
            }
            return Task.CompletedTask;
        }
    }
}