using background_job_worker.Configurations;
using background_job_worker.Data;
using background_job_worker.Infrastructures;
using background_job_worker.Jobs;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection.Extensions;
using shared_contracts.Interfaces;

var builder = WebApplication.CreateBuilder(args);

HangfireConfiguration.ConfigureGlobalFilters();
builder.Services.ConfigureHangfireWithPostgreSql(builder.Configuration);
builder.Services.TryAddScoped<IEmailService, EmailService>();
builder.Services.AddDbContext<ApplicationDbContext>(opts =>
{
    var dbConnect = builder.Configuration.GetConnectionString("DefaultConnection");
    opts.UseNpgsql(dbConnect);
});

var app = builder.Build();

app.AddHangfireDashBoardSetup(builder.Configuration);

app.Run();