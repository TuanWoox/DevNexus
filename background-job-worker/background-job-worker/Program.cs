using background_job_worker.Configurations;
using background_job_worker.Infrastructures.Hangfire;
using background_job_worker.Jobs;
using Microsoft.AspNetCore.Builder;

var builder = WebApplication.CreateBuilder(args);

HangfireConfiguration.ConfigureGlobalFilters();
builder.Services.ConfigureHangfireWithPostgreSql(builder.Configuration);
builder.Services.AddScoped<SampleJob>();

var app = builder.Build();

app.AddHangfireDashBoardSetup(builder.Configuration);

app.Run();