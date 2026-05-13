# Notification Service Project Context

## Purpose

`notification-service` owns user notifications, notification settings, notification mute rules, realtime notification delivery, and a local profile cache used to enrich notification payloads. It receives notification events from RabbitMQ, persists notification rows, applies user notification preferences, aggregates repeated events, and emits updates over Socket.IO.

The service starts on port `3002`, applies the global HTTP prefix `/api`, and exposes a Socket.IO namespace named `notifications`.

## Key Tech Stack

- Node.js / TypeScript with NestJS 11.
- Prisma 7 with PostgreSQL.
- Socket.IO via `@nestjs/websockets` and `@nestjs/platform-socket.io`.
- RabbitMQ via `amqplib`.
- JWT/cookie-based auth guards for controllers and websocket connections.
- Axios for cross-service initial sync calls.

## Main HTTP Endpoints

All routes are under `/api`.

- `GET /api`: default app health/hello endpoint.
- `POST /api/notifications/paging`: pages notifications for the authenticated profile.
- `GET /api/notifications/unread-count`: returns unread notification count.
- `PATCH /api/notifications/mark-all-read`: marks all notifications as read.
- `PATCH /api/notifications/:id/read`: marks one notification as read.
- `DELETE /api/notifications/:id`: deletes one notification.
- `GET /api/settings/global`: gets the profile's global notification setting.
- `PATCH /api/settings/global`: enables/disables all notifications for the profile.
- `POST /api/settings/mutes/paging`: pages entity-level mute rules.
- `POST /api/settings/mutes`: adds an entity/type mute rule.
- `DELETE /api/settings/mutes`: removes an entity/type mute rule.

## WebSocket Events

Namespace: `notifications`.

- On connection, the gateway validates a bearer token from socket auth or headers and tracks sockets by `profileId`.
- The service emits `notification:new` when a notification is created or updated for a connected user.
- The service emits `notification:unread-count` after notification changes.

## RabbitMQ Interaction

The service uses `RabbitMQService` in `src/modules/rabbitmq/rabbitmq.service.ts`.

### Notification Events

- Consumes topic exchange `devnexus_notifications`.
- Durable queue: `notification_service_queue`.
- Binding key: `notifications.*`.
- Expected payload: `PublishMessageBusDTO<NotiicationCreatedEntity>`.
- Handles only `MessageBusEntityEnum.Notification` with `MessageBusEnum.Create`.
- For each recipient:
  - Checks `NotificationGlobalSetting.AllNotifications`.
  - Checks `NotificationMuteSetting` for matching entity/type mutes.
  - Uses a `GroupKey` in the form `recipientId:entityType:entityId:eventType`.
  - Aggregates matching notifications created in the last 24 hours by incrementing `AggregatedCount`.
  - Creates new notification rows when no recent group match exists.
  - Emits realtime websocket updates to connected recipients.

### Sync Events

- Consumes fanout exchange `devnexus_sync`.
- Durable queue: `notification_service_sync_queue`.
- Handles `MessageBusEntityEnum.Profile` to maintain its local `Profile` cache.

## Database Interaction

The service owns its own Prisma/PostgreSQL schema with these main models:

- `Profile`: local profile snapshot used as notification recipient/actor data.
- `Notification`: persisted notification rows with recipient, actor, type, entity reference, preview data, read state, group key, and aggregation count.
- `NotificationGlobalSetting`: one-row-per-profile global notification kill switch.
- `NotificationMuteSetting`: per-profile mute for a specific `EntityType`, `EntityId`, and notification `Type`.

At startup, `InitialSyncService.performInitialSync()` blocks application startup until profile data has been synchronized from `platform-core-service`.
