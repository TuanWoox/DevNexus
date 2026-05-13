# DevNexus System Architecture

DevNexus is a multi-service capstone system built around a Next.js frontend, a primary .NET platform backend, specialized NestJS services for chat and notifications, a .NET background worker, and a Python AI worker. PostgreSQL is the main persistence layer, RabbitMQ is the event bus, Redis supports caching/queues, and Socket.IO handles realtime UX.

## 1. Service Roles

| Service | Role |
| :--- | :--- |
| **frontend** | Next.js 16 App Router UI. Handles SSR/client rendering, auth cookies, TanStack Query server state, Redux auth state, and calls backend APIs. It also connects to realtime message/notification sockets. |
| **platform-core-service** | Main .NET 9 backend and system of record. Owns accounts, identity, profiles, posts, Q&A, comments, votes, communities, moderation, follows, blocks, bookmarks, settings, admin workflows, and platform database writes. |
| **background-job-worker** | .NET worker that runs Hangfire jobs. Sends emails, links uploaded media, cleans media folders, publishes RabbitMQ events, and consumes AI responses back into the platform database. |
| **ai-worker** | Python FastAPI AI service. Provides direct AI endpoints for content tools, roadmaps, taxonomy, moderation, and code tools. Also consumes RabbitMQ AI tasks and publishes AI responses. |
| **message-service** | NestJS realtime messaging service. Owns chats, group chats, messages, media attachments, read receipts, edit history, chat settings, and message websocket events. Keeps local profile/follow/block snapshots. |
| **notification-service** | NestJS notification service. Owns persisted notifications, unread counts, global notification settings, mute rules, aggregation, and realtime notification websocket delivery. Keeps local profile snapshots. |

## 2. High-Level Data Flow

The frontend primarily talks to **platform-core-service** for the core social platform: auth, profiles, posts, Q&A, comments, votes, communities, admin, moderation, and AI usage logs. Client-side calls use Axios with bearer tokens from cookies; server-side Next.js pages use a fetch wrapper and cookie-based SSR prefetching.

For messaging, the frontend talks directly to **message-service** through its message API and Socket.IO namespace `message-chat`. Message history, chats, group metadata, media, typing events, read state, and message mutations live there, not in platform-core.

For notifications, the frontend talks directly to **notification-service** for notification lists/settings and connects to the notifications Socket.IO namespace for realtime notification pushes and unread count updates.

For AI features, there are two paths:
1. **Direct HTTP AI tools**: frontend/platform features can call ai-worker endpoints such as `/ai/content`, `/ai/code`, `/ai/roadmaps`, `/ai/taxonomy`, and `/ai/moderation`.
2. **Event-driven AI jobs**: platform-core enqueues Hangfire work, the background worker publishes AI tasks to RabbitMQ, the AI worker consumes them, and the background worker consumes the result back into the platform database.

## 3. Database Ownership

*   **platform-core-service** owns the main application PostgreSQL database: identity, profiles, posts, Q&A posts, answers, comments, votes, communities, follows, blocks, moderation, settings, and media metadata.
*   **background-job-worker** uses the same platform database because it executes deferred platform work: email jobs, media linking, social cleanup, and AI response persistence. Hangfire metadata is stored separately in PostgreSQL under the `Hangfire` schema/connection.
*   **message-service** owns its own Prisma/PostgreSQL schema for chats, messages, chat settings, message media, read receipts, and local copies of profiles/follows/blocks.
*   **notification-service** owns its own Prisma/PostgreSQL schema for notifications, notification settings, mute rules, and local profile copies.
*   **ai-worker** has its own async SQLAlchemy database area for AI usage logs and AI-side metadata.

## 4. Event-Driven Communication

RabbitMQ connects the services through three main exchanges:

| Exchange | Type | Producers | Consumers | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `devnexus_sync` | fanout | background-job-worker | message-service, notification-service | Sync profile/social data from platform-core into specialized service databases. |
| `devnexus_notifications` | topic | background-job-worker, message-service | notification-service | Create notification records and realtime notification pushes. |
| `devnexus_ai_tasks` | topic | background-job-worker | ai-worker | Dispatch AI tasks such as AI First Responder. |
| `devnexus_ai_responses` | topic | ai-worker | background-job-worker | Return AI task results to the .NET side. |

### Profile/Social Sync Flow
1. User updates profile, follows someone, or blocks someone through **platform-core-service**.
2. Platform-core saves the change to its database.
3. Platform-core enqueues a Hangfire job.
4. **background-job-worker** executes `PublishMessageBackgroundJobs.PublishEntity`.
5. Worker publishes to `devnexus_sync`.
6. **message-service** consumes profile, follow, and block events into its local schema.
7. **notification-service** consumes profile events into its local profile cache.

*This lets message and notification services make fast local decisions without querying platform-core for every request.*

### Notification Flow
1. A platform action occurs: vote, comment, answer, follow, moderation result, etc.
2. **platform-core-service** builds a notification event and enqueues a Hangfire publish job.
3. **background-job-worker** publishes to `devnexus_notifications` with routing keys like `notifications.vote`, `notifications.comment`, `notifications.answer`, or `notifications.follow`.
4. **notification-service** consumes `notifications.*`.
5. It checks global notification settings and entity mute rules.
6. It creates or aggregates a notification row.
7. It emits `notification:new` and `notification:unread-count` over Socket.IO.

*Message requests have a similar path, but the producer is message-service: its BullMQ chatsetting processor publishes notifications.message to devnexus_notifications.*

### AI First Responder Flow
1. A Q&A post is approved through moderation/admin/platform logic.
2. **platform-core-service** creates an `AIFirstResponderRequestDTO`.
3. Platform-core enqueues `IPublishMessageBackgroundJobs.PublicAiTask`.
4. **background-job-worker** publishes the task to `devnexus_ai_tasks` with routing key `ai.task.firstresponder.request`.
5. **ai-worker** has `FirstResponderConsumer` bound to `ai.task.firstresponder.#`.
6. The AI worker validates `MessageBusEntityEnum.AIFirstResponder`, calls Gemini through `CodeToolsService.generate_first_response`, and publishes a response to `devnexus_ai_responses` with routing key `ai.response.firstresponder`.
7. **background-job-worker** consumes `ai.response.#`.
8. For `ai.response.firstresponder`, it creates an `Answer row` in the platform database using the generated AI comment.

### Moderation Flow
There is also an HTTP-based moderation path:
1. Content is submitted to **ai-worker** via `/ai/moderation`.
2. The AI worker runs a 3-tier pipeline:
    *   local ML models for coarse filtering,
    *   Gemini for gray-zone decisions,
    *   human review escalation when confidence is low.
3. It calls **platform-core-service** internal endpoints:
    *   `/internal/moderation/callback`
    *   `/internal/moderation/queue`
4. Platform-core updates moderation state and may trigger follow-up jobs/events, including AI First Responder for approved Q&A posts.

## System Shape

The main architectural pattern is: **platform-core** remains the source of truth, while specialized services own their bounded contexts. RabbitMQ keeps those contexts synchronized and decoupled. Hangfire shields user-facing .NET APIs from slow side effects. The AI worker is both an HTTP AI API and an async RabbitMQ worker. The frontend composes these capabilities through separate API clients and realtime socket connections.