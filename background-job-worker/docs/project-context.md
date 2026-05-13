# Background Job Worker Project Context

## Purpose

`background-job-worker` executes asynchronous work for DevNexus. It runs the Hangfire server, exposes the Hangfire dashboard, performs email and media maintenance jobs, publishes platform events to RabbitMQ, and consumes AI result messages back into the platform database.

Although the project SDK is `Microsoft.NET.Sdk.Worker`, it builds a minimal ASP.NET Core `WebApplication` so it can host the Hangfire dashboard.

## Key Tech Stack

- .NET 9 worker/web host.
- Hangfire 1.8 with PostgreSQL storage.
- Entity Framework Core 9 with PostgreSQL, using the shared `platform-core-service.Data` `ApplicationDbContext`.
- Shared platform Business/Common/Data projects for entities, interfaces, services, DTOs, and RabbitMQ clients.
- RabbitMQ.Client for message publishing and AI result consumption.
- MailKit/MimeKit for SMTP email sending.
- AutoMapper for shared platform mappings.

## Hangfire Setup

Configured in `Infrastructures/HangfireSetupExtensions.cs`.

- Storage: PostgreSQL connection string `HangfireConnection`, schema `hangfire`.
- Server:
  - `WorkerCount = 3`
  - queue: `default`
  - polling interval: 500ms
  - server name: `Hangfire.Server.{MachineName}`
- Dashboard route: `/backgroundjobs/hangfire`.
- Dashboard basic auth is read from `AccountToAccessHangfireDashboard:User` and `AccountToAccessHangfireDashboard:Password`.
- Global retry filter: 5 attempts with delays of 1, 2, 5, 10, and 30 seconds; exceeded jobs are deleted.

## Main Background Jobs

- `EmailBackgroundJobs.SendAsync(toEmail, subject, htmlBody)`
  - Sends transactional email through SMTP settings from `SmtpSettings`.

- `MediaBackgroundJobs.UpdatePostMediaPostId(userId, postId, ids)`
  - Links staged `PostMedia` rows to a post after post creation/update.

- `MediaBackgroundJobs.UpdateQAPostMediaQAPostId(userId, qaPostId, ids)`
  - Links staged `QAMedia` rows to a Q&A post.

- `MediaBackgroundJobs.CleanUpOrphanFiles()`
  - Deletes old media files that are treated as orphaned according to database metadata.

- `MediaBackgroundJobs.CleanUpAbandonedTempFolders()`
  - Deletes abandoned chunk-upload temp folders older than 24 hours from configured upload roots.

- `ProfileBackgroundJobs.DeleteFollowRequestAndUserFollow(profileId, blockProfileId)`
  - Removes conflicting follow requests and user-follow rows after a block.

- `PublishMessageBackgroundJobs.PublishEntity(entity, messageBus, messageBusEntity)`
  - Wraps an entity in `PublishMessageBusDTO` and publishes it to the default sync bus.

- `PublishMessageBackgroundJobs.PublicNotification(entity, routingKey)`
  - Wraps a notification entity and publishes it to the notification bus.

- `PublishMessageBackgroundJobs.PublicAiTask(entity, routingKey, messageBus, messageBusEntity)`
  - Wraps an AI task entity and publishes it to the AI task bus.

## Scheduled Jobs

Registered by `BackgroundJobScheduler.RegisterScheduledJobs()`:

- `media-cleanup-orphan-files`: runs every 6 hours.
- `media-cleanup-abandoned-temp-folders`: runs every 12 hours.

## RabbitMQ Interaction

The worker registers three keyed singleton `IMessageBusClient` implementations:

- Key `default`: `MessageBusClient`
  - Publishes to fanout exchange `devnexus_sync`.
  - Used for profile, follow, and block sync events consumed by message/notification services.

- Key `notification`: `NotificationMessageBusClient`
  - Publishes to topic exchange `devnexus_notifications`.
  - Used for notification events with routing keys such as `notifications.comment`, `notifications.message`, or `notifications.default`.

- Key `aitask`: `AITaskMessageBusClient`
  - Publishes to topic exchange `devnexus_ai_tasks`.
  - Used for AI work requests such as first responder tasks.

The worker also hosts `AIUniversalResultConsumer`:

- Connects to RabbitMQ host from `RabbitMQ:RabbitMQHost`.
- Consumes topic exchange `devnexus_ai_responses`.
- Durable queue: `ai_universal_results_queue`.
- Binding key: `ai.response.#`.
- Handles `ai.response.firstresponder` by deserializing `AIFirstResponseResultDTO`, finding the target post, creating an `Answer` row with the generated content, and saving it to the platform database.
- ACKs successfully routed messages and NACKs failed messages without requeue.

## Database Interaction

The worker uses the same PostgreSQL application database as `platform-core-service` through `ApplicationDbContext`.

It reads/writes:

- Identity users, to find the admin author for AI-generated first-responder answers.
- Posts and answers, to save AI responses.
- Follow requests and user follows, to clean up social graph state after blocks.
- Post/Q&A media rows, to attach staged uploads and clean media metadata.
- Settings, through `IConfigurationService`, for upload folder configuration.

Hangfire itself stores jobs and server metadata in the separate PostgreSQL Hangfire schema configured by `HangfireConnection`.
