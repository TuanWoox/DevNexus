using background_job_worker.Configurations;
using background_job_worker.Infrastructures;
using background_job_worker.Jobs;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection.Extensions;
using platform_core_service.Business.MessageBus;
using platform_core_service.Business.Repository;
using platform_core_service.Business.Services;
using platform_core_service.Common.Interfaces.BackgroundJobs;
using platform_core_service.Common.Interfaces.MessageBus;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Data;

var builder = WebApplication.CreateBuilder(args);

// ── Database ────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<ApplicationDbContext>(opts =>
{
    opts.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        npgsql => npgsql.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorCodesToAdd: null
        )
    );
});

// ── Caching ─────────────────────────────────────────────────────────────────
builder.Services.AddDistributedMemoryCache();

// ── Hangfire ─────────────────────────────────────────────────────────────────
HangfireConfiguration.ConfigureGlobalFilters();
builder.Services.ConfigureHangfireWithPostgreSql(builder.Configuration);

// ── Mapping ──────────────────────────────────────────────────────────────────
builder.Services.AddAutoMapper(
    typeof(ConfigurationService).Assembly,
    typeof(MediaBackgroundJobs).Assembly
);

// ── Repositories ─────────────────────────────────────────────────────────────
builder.Services.AddScoped(typeof(IRepository<,>), typeof(Repository<,>));

// ── Services ──────────────────────────────────────────────────────────────────
builder.Services.TryAddScoped<IConfigurationService, ConfigurationService>();
builder.Services.AddSingleton<IMessageBusClient, MessageBusClient>();

// ── Background Jobs ───────────────────────────────────────────────────────────
builder.Services.TryAddScoped<IEmailBackgroundJobs, EmailBackgroundJobs>();
builder.Services.TryAddScoped<IMediaBackgroundJobs, MediaBackgroundJobs>();
builder.Services.TryAddScoped<IProfileBlockBackgroundJobs, ProfileBackgroundJobs>();
builder.Services.TryAddScoped<IPublishMessageBackgroundJobs, PublishMessageBackgroundJobs>();

var app = builder.Build();

app.AddHangfireDashBoardSetup(builder.Configuration);

// Register all scheduled background jobs
BackgroundJobScheduler.RegisterScheduledJobs(app.Services);

app.Run();