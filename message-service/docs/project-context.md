# Message Service Project Context

## Purpose

`message-service` is the real-time chat service for DevNexus. It owns chat rooms, group membership, per-user chat settings, messages, media attachments, read receipts, message edit history, and locally cached social/profile data needed for messaging decisions.

The service starts on port `3001`, applies the global HTTP prefix `/api`, and exposes a Socket.IO namespace named `message-chat`.

## Key Tech Stack

- Node.js / TypeScript with NestJS 11.
- Prisma 7 with PostgreSQL.
- Socket.IO via `@nestjs/websockets` and `@nestjs/platform-socket.io`.
- RabbitMQ via `amqplib`.
- BullMQ with Redis for delayed/background chat-setting jobs.
- Multer memory storage for message/group media upload handling.
- JWT/cookie-based auth guards shared across controllers and websocket handshakes.

## Main HTTP Endpoints

All routes are under `/api` and most are protected by `AuthGuard`.

- `POST /api/auth/set-cookie`: stores auth cookie data for this service.
- `POST /api/chats`: creates a direct or group chat, optionally with uploaded image data.
- `POST /api/chats/paging`: pages the authenticated user's chat list.
- `POST /api/chats/search`: searches contacts and groups.
- `GET /api/chats/:chatId`: gets one chat.
- `GET /api/chats/:chatId/members`: lists group members.
- `PATCH /api/chats/:chatId/group`: updates group metadata.
- `POST /api/chats/:chatId/group/picture`: uploads a group picture.
- `POST /api/chats/:chatId/members`: adds members.
- `DELETE /api/chats/:chatId/members/:profileId`: removes a member.
- `POST /api/chats/:chatId/leave`: leaves a group.
- `PATCH /api/chats/:chatId/members/:profileId/role`: updates member role.
- `POST /api/chats/:chatId/transfer`: transfers ownership.
- `PATCH /api/chatsettings`: updates chat settings.
- `PATCH /api/chatsettings/nickname`: updates a chat nickname.
- `DELETE /api/chatsettings/:id/messages`: deletes/clears visible messages up to a marker.
- `POST /api/messages`: creates a message and optional attached file.
- `POST /api/messages/read`: marks a chat as read.
- `POST /api/messages/paging/:chatId`: pages messages in a chat.
- `POST /api/messages/media/:chatId`: pages media for a chat.
- `DELETE /api/messages/:messageId`: soft-deletes a message.
- `POST /api/messages/:messageId/undo-delete`: restores a deleted message.
- `PATCH /api/messages/:messageId`: edits a message.
- `POST /api/messages/:messageId/edit-history`: pages edit history.
- `POST /api/messages/:messageId/readers`: pages read receipts.
- `GET /api/medias/:filename`: serves stored message media.
- `GET /api/profiles/search`, `GET /api/profiles/:profileId`, `POST /api/profiles/search/following`, `POST /api/profiles/search/contacts`: profile/contact lookup over the service's local profile cache.

## WebSocket Events

Namespace: `message-chat`.

- On connection, the gateway validates a bearer token from socket auth or headers and tracks sockets by `profileId`.
- `join-chat`: joins room `chat:{chatId}`.
- `leave-chat`: leaves room `chat:{chatId}`.
- `typing-start`: broadcasts typing state to other sockets in the chat, excluding all sockets of the sender.
- `typing-stop`: clears typing state for other sockets in the chat.
- Server-side services can call `emitToUsers(profileIds, event, data)` to push chat events to connected profiles.

## Background Jobs

BullMQ processor: `chatsetting`.

- `unMute`: clears `MuteUntil` and `IsMuted` for a `ChatSetting`.
- `sendMessageNotification`: finds recipients for message-request chats, filters muted settings, and publishes a notification event to RabbitMQ exchange `devnexus_notifications` with routing key `notifications.message`.

## RabbitMQ Interaction

The service uses `RabbitMQService` in `src/modules/rabbit-mq/rabbitmq.service.ts`.

- Connects to `RABBITMQ_URL`, defaulting to `amqp://localhost`.
- Consumes from fanout exchange `devnexus_sync`.
- Durable queue: `message_service_sync_queue`.
- Handles sync events by `MessageBusEntityEnum`:
  - `Profile`: updates local `Profile` rows.
  - `ProfileBlock`: updates local block rows.
  - `UserFollow`: updates local follow rows.
- Publishes notification events to topic exchange `devnexus_notifications`, currently for message request notifications.

## Database Interaction

The service owns its own Prisma/PostgreSQL schema with these main models:

- `Profile`: local profile snapshot from platform-core.
- `ProfileBlock`, `UserFollow`: local social graph snapshots from platform-core.
- `Chat`, `ProfileChat`: direct/group chat and membership data.
- `ChatSetting`: per-user settings including mute, pin, archive, request state, role, and delete-up-to marker.
- `Message`: chat message content, sender, deleted/edited state.
- `MessageEditHistory`: previous content for edited messages.
- `MessageReadReceipt`: composite key of message and reader.
- `Media`: uploaded media attached to messages.

At startup, `InitialSyncService.performInitialSync()` blocks application startup until the service has synchronized its local profile/social data from `platform-core-service` via the platform sync API.
