# Background Job Worker with Hangfire

This is a .NET 9 Worker Service integrated with Hangfire for background job processing.

## Prerequisites

- .NET 9 SDK
- PostgreSQL database server

## Configuration

### Database Setup

1. Create a PostgreSQL database for Hangfire:
   ```sql
   CREATE DATABASE devnexus_hangfire_dev;
   ```

2. Update the connection string in `appsettings.json` or `appsettings.Development.json`:
   ```json
   "ConnectionStrings": {
     "HangfireConnection": "Host=localhost;Port=5432;Database=devnexus_hangfire_dev;Username=postgres;Password=yourpassword"
   }
   ```

### Dashboard Authentication

The Hangfire dashboard is protected with basic authentication. Update credentials in your config files:

```json
"AccountToAccessHangfireDashboard": {
  "User": "admin",
  "Password": "your-secure-password"
}
```

## Running the Application

1. Build the project:
   ```bash
   dotnet build
   ```

2. Run the application:
   ```bash
   dotnet run
   ```

3. The application will start on `http://localhost:5000`

## Accessing Hangfire Dashboard

Navigate to: `http://localhost:5000/backgroundjobs/hangfire`

Login with the credentials configured in your appsettings.json.

## API Endpoints

### Health Check
- **GET** `/` - Returns service status

### Job Management
- **POST** `/api/jobs/sample?message=YourMessage` - Enqueue a fire-and-forget job
- **POST** `/api/jobs/sample/schedule?message=YourMessage&delaySeconds=30` - Schedule a delayed job

### Example using curl:

```bash
# Enqueue immediate job
curl -X POST "http://localhost:5000/api/jobs/sample?message=Hello"

# Schedule delayed job
curl -X POST "http://localhost:5000/api/jobs/sample/schedule?message=DelayedHello&delaySeconds=30"
```

## Features

### Automatic Retry
Jobs are configured with automatic retry on failure:
- 5 retry attempts
- Progressive delays: 1s, 2s, 5s, 10s, 30s
- Jobs are deleted after all attempts are exhausted

### Hangfire Server Configuration
- Worker Count: 3
- Server Timeout: 5 minutes
- Shutdown Timeout: 5 minutes
- Queue: "default"
- Schedule Polling Interval: 500ms

### Database Storage
- PostgreSQL storage with automatic schema creation
- Schema name: "hangfire"

## Creating Custom Jobs

1. Create a new job class in the `Jobs` folder:

```csharp
public class MyCustomJob
{
    private readonly ILogger<MyCustomJob> _logger;

    public MyCustomJob(ILogger<MyCustomJob> logger)
    {
        _logger = logger;
    }

    public async Task ExecuteAsync(string parameter)
    {
        _logger.LogInformation("Job started with: {Parameter}", parameter);
        
        // Your job logic here
        await Task.Delay(1000);
        
        _logger.LogInformation("Job completed");
    }
}
```

2. Register the job in `Program.cs`:

```csharp
builder.Services.AddScoped<MyCustomJob>();
```

3. Enqueue the job:

```csharp
// Fire-and-forget
BackgroundJob.Enqueue<MyCustomJob>(job => job.ExecuteAsync("parameter"));

// Delayed
BackgroundJob.Schedule<MyCustomJob>(job => job.ExecuteAsync("parameter"), TimeSpan.FromMinutes(5));

// Recurring
RecurringJob.AddOrUpdate<MyCustomJob>(
    "my-job-id",
    job => job.ExecuteAsync("parameter"),
    Cron.Daily());
```

## Cron Expressions

Hangfire supports standard cron expressions for recurring jobs:

- `Cron.Minutely()` - Every minute
- `Cron.Hourly()` - Every hour
- `Cron.Daily()` - Every day at midnight
- `Cron.Weekly()` - Every Sunday
- `Cron.Monthly()` - First day of each month
- Custom: `"*/5 * * * *"` - Every 5 minutes

## Monitoring

The Hangfire Dashboard provides:
- Real-time job monitoring
- Job history and statistics
- Failed job inspection and retry
- Server status and metrics
- Recurring job management

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Verify connection string
- Check database user permissions

### Dashboard Access Issues
- Verify credentials in appsettings.json
- Check if the application is running on the correct port
- Clear browser cache/cookies

### Jobs Not Processing
- Check Hangfire server status in the dashboard
- Verify queue names match
- Review application logs for errors
