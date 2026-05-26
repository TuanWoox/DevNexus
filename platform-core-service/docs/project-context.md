# Platform Core Service Project Context

## Purpose

`platform-core-service` is the main DevNexus backend API. It owns accounts, identity, profiles, posts, Q&A posts, answers, comments, votes, communities, moderation, bookmarks, media metadata, settings, follows, blocks, and admin workflows. It is also the source of truth for profile/social data that downstream services sync into their own databases.

In Docker it is exposed on port `8080`. Controllers use explicit routes such as `api/[controller]`, and some internal routes use `internal/...`.

## Key Tech Stack

- ASP.NET Core on .NET 9.
- Entity Framework Core 9 with PostgreSQL.
- ASP.NET Core Identity with JWT bearer auth.
- Hangfire with PostgreSQL storage for background job enqueueing.
- AutoMapper for DTO/entity mapping.
- Cloudinary integration for media.
- Redis connection multiplexer and in-memory/distributed caching configuration.
- Swagger/OpenAPI in development.
- RabbitMQ client classes live in the Business project, but actual keyed client registration and publishing are handled by `background-job-worker`.

## Main API Areas

The service contains many controllers. Important groups include:

- `api/Accounts`: register, login, refresh token, logout, password changes, reset password, email confirmation, Google login, GitHub login.
- `api/Profiles`: profile get/create/update.
- `api/UserFollows`: follow, unfollow, followers/followings paging.
- `api/FollowRequests`: approve/reject/cancel follow requests and bulk operations.
- `api/ProfileBlocks`: block/unblock profiles and page block records.
- `api/Posts`: create/read/page/update/delete posts, including profile and community paging.
- `api/QAPosts`: create/read/page/update/delete Q&A posts.
- `api/Answers`: create/read/page/update/delete answers and accept answers.
- `api/Comments`: create/read/update/delete comments, replies, and post/answer comment paging.
- `api/Votes`: vote on posts, answers, and comments.
- `api/Communities`, `api/CommunityModerators`, `api/community-members`, `api/CommunityMedia`: community CRUD, moderators, joins/leaves, membership requests, bans, media.
- `api/BookMarks`, `api/BookMarkedItems`: bookmark folders and items.
- `api/PostMedia`, `api/QAMedia`, `api/ProfileMedia`: image upload, video upload initialization/chunk/merge, media paging, primary media, and deletes.
- `api/SystemSettings`: settings CRUD and moderation banned keywords.
- `api/AdminUsers`, `api/AdminPosts`, `api/AdminModeration`, `api/AdminDashboard`, `api/admintags`: administrative workflows.
- `api/AiUsageLogs`: AI usage paging and summary.
- `internal/moderation`: moderation callback and queue endpoints protected by internal API-key middleware.
- `api/MicroserviceSync`: API-key protected snapshot endpoints for downstream services:
  - `GET profiles/count`
  - `POST profiles/paging`
  - `GET profile-blocks/count`
  - `POST profile-blocks/paging`
  - `GET user-follows/count`
  - `POST user-follows/paging`

## Background Job Usage

Platform-core configures Hangfire with PostgreSQL and enqueues jobs from business services, but the job implementations are in `background-job-worker`.

Common enqueue patterns:

- `AccountService`: sends account emails through `IEmailBackgroundJobs`.
- `ProfileService`: publishes profile create/update sync events.
- `UserFollowService`: publishes follow create/delete/bulk-delete sync events and notification events.
- `ProfileBlockService`: publishes block create/delete/bulk-delete sync events and removes existing follows/follow requests when a block is created.
- `PostService` and `QAPostService`: link uploaded media to created/updated posts through `IMediaBackgroundJobs`.
- `VoteService`, `CommentService`, `AnswerService`, moderation/admin services: enqueue notification publishing and moderation-result events.
- AI-related flows enqueue tasks through `IPublishMessageBackgroundJobs.PublicAiTask`.

## RabbitMQ Interaction

Platform-core defines the message-bus DTOs, enums, and client implementations used by the background worker:

- `MessageBusEnum`: `Create`, `Update`, `Delete`, `BulkDelete`.
- `MessageBusEntityEnum`: `Profile`, `UserFollow`, `ProfileBlock`, `Notification`, `AIFirstResponder`.
- `MessageBusClient`: publishes sync events to fanout exchange `devnexus_sync`.
- `NotificationMessageBusClient`: publishes notification events to topic exchange `devnexus_notifications`, default routing key `notifications.default`.
- `AITaskMessageBusClient`: publishes AI task events to topic exchange `devnexus_ai_tasks`, default routing key `ai.default`.

Because the core API only enqueues Hangfire jobs, RabbitMQ publishing is effectively performed by `background-job-worker` when it executes `PublishMessageBackgroundJobs`.

## Database Interaction

The service owns the main PostgreSQL application database through `ApplicationDbContext`, which extends ASP.NET Identity's `IdentityDbContext`. Major DbSets include:

- Identity: users, roles, user roles, claims/logins/tokens.
- Platform content: profiles, posts, Q&A posts, answers, comments, votes, tags, bookmarks.
- Community: communities, moderators, members, membership requests, bans, media.
- Social graph: profile blocks, user follows, follow requests.
- Media: profile media, community media, post media, Q&A media.
- Moderation: moderation queue entries and post moderation results.
- Settings: global configuration/settings.

`Program.Main` applies EF migrations at startup and warms configuration settings through `IConfigurationService.GetAllSettingsDynamicAsync()`.
