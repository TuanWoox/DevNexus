using background_job_worker.Configurations;
using background_job_worker.Infrastructures;
using background_job_worker.Jobs;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection.Extensions;
using platform_core_service.Common.Interfaces.BackgroundJobs;
using platform_core_service.Data;

var builder = WebApplication.CreateBuilder(args);

HangfireConfiguration.ConfigureGlobalFilters();
builder.Services.ConfigureHangfireWithPostgreSql(builder.Configuration);
builder.Services.TryAddScoped<IEmailBackgroundJobs, EmailBackgroundJobs>();
builder.Services.TryAddScoped<IProfileBlockBackgroundJobs, ProfileBackgroundJobs>();
builder.Services.AddDbContext<ApplicationDbContext>(opts =>
{
    var dbConnect = builder.Configuration.GetConnectionString("DefaultConnection");
    opts.UseNpgsql(dbConnect, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorCodesToAdd: null);
    });
});

var app = builder.Build();

app.AddHangfireDashBoardSetup(builder.Configuration);

app.Run();