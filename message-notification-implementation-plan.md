# Message Notification Implementation Plan

## Overview

Implement notification system for the message service using Bull queue (like chat settings) to send notifications in the background. The system will:
- Send `MESSAGE_REQUEST` when a user sends a first message to someone (chat created with `IsRequested: true`)
- **NOT send notifications for regular messages** (they pop up immediately in UI via WebSocket)
- Use notification grouping with `GroupKey` and `AggregatedCount` to handle multiple request messages
- Respect mute settings from ChatSettings

## Why Only MESSAGE_REQUEST?

- **Regular messages**: Already pop up immediately in the UI via real-time WebSocket
- **Archived chats**: Don't create notifications (user archived them intentionally)
- **Message requests**: Need notifications because they go to a separate "Requests" tab that users don't check frequently

---

## Current State

### ✅ Already Exists:
1. **Notification Event Types** (both backend C# and frontend TypeScript):
   - `MESSAGE_REQUEST = 22` ✅

2. **Message Mapping** (convertTypeToMessage.ts):
   - `MESSAGE_REQUEST`: `${a} sent you a message request` ✅
   - **Note**: Aggregation text ("and X others") is automatically added by frontend (notification-item.tsx lines 58-62)

3. **Notification Grouping Mechanism** (notification-service):
   - GroupKey format: `${recipientId}:${entityType}:${entityId}:${eventType}`
   - When existing notification found (within 24h): increment `AggregatedCount`, update `ActorId`, mark as unread
   - Frontend displays: Base message from `convertTypeToMessage` + "**and X others**" (if AggregatedCount > 1)
   - Example: "User B sent you a message request **and 2 others**"

4. **Bull Queue Setup** (message-service):
   - `chatsetting` queue with processor already exists ✅
   - Can reuse or create new `message-notification` queue

---

## Message Notification Logic

### MESSAGE_REQUEST - Grouped by Recipient
**When**: Any user sends a message request to User C

**Notification Grouping**:
- **All message requests to the same recipient are grouped into ONE notification**
- GroupKey: `${recipientId}:MESSAGE_REQUEST` (NO ChatId - groups all requests together)
- Latest sender's info is shown (ActorId updates to most recent sender)
- AggregatedCount tracks total number of different people who sent requests
- ActionUrl points to the latest sender's chat

**Example Flow**:
1. User A sends message request to User C
   - Notification created: "User A sent you a message request"
   - AggregatedCount = 1
   - ActionUrl = `/messages?chatId={chatA}`

2. User B sends message request to User C
   - Same notification **updated** (not new notification)
   - ActorId changes to User B
   - AggregatedCount = 2
   - Display: "**User B** sent you a message request **and 1 other**"
   - ActionUrl = `/messages?chatId={chatB}` (latest sender)

3. User D sends message request to User C
   - Same notification **updated** again
   - ActorId changes to User D
   - AggregatedCount = 3
   - Display: "**User D** sent you a message request **and 2 others**"
   - ActionUrl = `/messages?chatId={chatD}` (latest sender)

**Notification**:
- EventType: `MESSAGE_REQUEST`
- EntityType: `MESSAGE`
- EntityId: `"message_requests"` (static string, not ChatId - for grouping all requests)
- EntityTitle: Sender's full name (latest sender)
- EntityPreview: First 100 chars of message content (latest message)
- ActorId: Latest sender's profile ID
- RecipientId: Recipient's profile ID
- ActionUrl: `/messages/{latestChatId}` (points to latest sender's chat)
- GroupKey: `${recipientId}:MESSAGE:message_requests:MESSAGE_REQUEST`

**When to Stop Sending**:
- Once User C accepts a specific request (`IsRequested` → `false` for that chat), that chat stops contributing to the count
- Clicking the notification automatically marks it as read (handled by frontend)
- New requests from other users continue to update the same notification

---

## Mute Settings

**Check ChatSettings before sending notification**:
```typescript
const chatSetting = await prisma.chatSetting.findFirst({
  where: {
    ChatId: chatId,
    ProfileId: recipientId,
    IsMuted: true
  }
});

if (chatSetting) {
  // Skip notification for this recipient
  return;
}
```

**Note**: This is different from NotificationMuteSetting (which mutes specific entity types). ChatSettings.IsMuted mutes the entire chat.

---

## Implementation Architecture

### Option 1: Use Existing `chatsetting` Queue (Recommended)
- Reuse existing Bull setup
- Add new job type: `sendMessageNotification`
- Processor handles both `unMute` and `sendMessageNotification`

### Option 2: Create New `message-notification` Queue
- Separate queue for message notifications
- Better separation of concerns
- More overhead (separate processor, module setup)

**Recommendation**: Use Option 1 (existing queue) for simplicity.

---

## Implementation Steps

### Step 1: Add Missing Backend Enum (if needed)
Check if `MESSAGE` exists in `NotificationEntityType` enum in `NotiicationCreatedEntityDTO.cs`:
```csharp
public enum NotificationEntityType
{
    POST,
    QUESTION,
    COMMENT,
    ANSWER,
    COMMUNITY,
    PROFILE,
    MESSAGE,  // <-- Verify this exists
}
```

### Step 2: Update Message Service

#### 2.1: Install/Setup Bull Dependencies
Ensure `@nestjs/bullmq` and `bullmq` are installed and configured.

#### 2.2: Update `messages.service.ts`

**Add Dependencies**:
```typescript
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

constructor(
  // ... existing dependencies
  @InjectQueue('chatsetting') private readonly chatSettingQueue: Queue,
) {}
```

**Add Helper Method**:
```typescript
private async enqueueMessageNotification(
  chatId: string,
  senderId: string,
  messageContent: string
) {
  await this.chatSettingQueue.add(
    'sendMessageNotification',
    {
      chatId,
      senderId,
      messageContent,
    },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    }
  );
}
```

**Update `createMessage` Method** (after line 76):
```typescript
if (createMessage) {
  await this.prismaService.chat.update({
    where: { Id: createEntity.ChatId },
    data: { DateModified: new Date() }
  });
  if (file) {
    await this.mediasService.handleUpload(file, createMessage.Id);
  }
  
  // Only enqueue notification for the FIRST message in a request chat
  // Check if this is a request AND if this is the first message (chat just created)
  const chatSetting = await this.prismaService.chatSetting.findFirst({
    where: {
      ChatId: createEntity.ChatId,
      ProfileId: { not: profileId },
      IsRequested: true  // Only if it's a request
    }
  });
  
  if (chatSetting) {
    // Check if this is the first message in the chat
    const messageCount = await this.prismaService.message.count({
      where: { ChatId: createEntity.ChatId }
    });
    
    // Only send notification for the first message (chat creation)
    if (messageCount === 1) {
      await this.enqueueMessageNotification(
        createEntity.ChatId,
        profileId,
        createEntity.Content
      );
    }
  }
}
```

#### 2.3: Update `chatsetting.processor.ts`

**Add Interface**:
```typescript
interface SendMessageNotificationData {
  chatId: string;
  senderId: string;
  messageContent: string;
}
```

**Add RabbitMQ Service Dependency**:
```typescript
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

constructor(
  private readonly prismaService: PrismaService,
  private readonly logger: Logger,
  @InjectQueue('rabbitmq-publish') private readonly publishQueue: Queue, // Or inject RabbitMQ service
) {
  super();
}
```

**Update `process` Method**:
```typescript
async process(job: Job) {
  try {
    switch (job.name) {
      case 'unMute':
        await this.unMuteChatSetting(job.data as UnmuteData);
        break;
      case 'sendMessageNotification':
        await this.sendMessageNotification(job.data as SendMessageNotificationData);
        break;
      default:
        this.logger.log("Does not match any pattern")
    }
  }
  catch (ex) {
    this.logger.log(ex)
  }
}
```

**Add Notification Method**:
```typescript
private async sendMessageNotification(data: SendMessageNotificationData) {
  try {
    const { chatId, senderId, messageContent } = data;
    
    // Get chat with members and settings
    const chat = await this.prismaService.chat.findFirst({
      where: { Id: chatId },
      include: {
        Members: true,
        ChatSettings: {
          where: { IsRequested: true } // Only get request settings
        },
      }
    });
    
    if (!chat) {
      this.logger.warn(`Chat ${chatId} not found`);
      return;
    }
    
    // Get sender profile
    const sender = await this.prismaService.profile.findFirst({
      where: { Id: senderId },
      select: { FullName: true }
    });
    
    // Get recipients who have this as a request (IsRequested: true)
    const requestRecipients = chat.ChatSettings
      .filter(cs => !cs.IsMuted) // Also filter out muted
      .map(cs => cs.ProfileId);
    
    if (requestRecipients.length === 0) {
      this.logger.log(`No request recipients for chat ${chatId}`);
      return;
    }
    
    // Publish notification event to RabbitMQ
    // IMPORTANT: EntityId is "message_requests" (static) to group ALL requests together
    const notificationEvent = {
      EventType: 'MESSAGE_REQUEST', // Use enum value
      ActorId: senderId,
      RecipientId: requestRecipients, // Array for multiple recipients
      EntityType: 'MESSAGE', // Use enum value
      EntityId: 'message_requests', // Static string - groups all message requests together!
      EntityTitle: sender?.FullName,
      EntityPreview: messageContent?.substring(0, 100),
      ActionUrl: `/messages/${chatId}`, // Format: /messages/{chatId}
      Timestamp: new Date(),
    };
    
    // Publish to RabbitMQ (adjust based on your RabbitMQ setup)
    // Option 1: Use background job client (if available)
    // await this.publishQueue.add('publishNotification', notificationEvent);
    
    // Option 2: Direct RabbitMQ publish (implement based on your setup)
    // await this.rabbitMQService.publish('devnexus_notifications', 'notifications.message', notificationEvent);
    
    this.logger.log(`MESSAGE_REQUEST notification queued for chat ${chatId}, recipients: ${requestRecipients.length}`);
  }
  catch (ex) {
    this.logger.error('Error sending message notification:', ex);
    throw ex; // Re-throw to trigger Bull retry
  }
}
```

### Step 3: Extend Existing RabbitMQ Service

The message-service already has a RabbitMQ service (`src/modules/rabbit-mq/rabbitmq.service.ts`) that consumes from `devnexus_sync` exchange. We need to add publishing capability to send notifications to `devnexus_notifications` exchange.

#### 3.1: Add Publish Method to Existing RabbitMQ Service

**Update `src/modules/rabbit-mq/rabbitmq.service.ts`:**

Add the publish method after the `onConsume` method:

```typescript
async publish(exchange: string, routingKey: string, message: any) {
  try {
    // Assert the notifications exchange (creates if doesn't exist)
    await this.channel.assertExchange(exchange, 'topic', {
      durable: true,
    });

    const messageBuffer = Buffer.from(JSON.stringify(message));
    this.channel.publish(exchange, routingKey, messageBuffer, {
      persistent: true,
    });
    
    console.log(`Published message to ${exchange} with routing key ${routingKey}`);
  } catch (error) {
    console.error(`Failed to publish message to ${exchange}:`, error);
    throw error;
  }
}
```

**Key Points**:
- Reuses existing RabbitMQ connection and channel
- `assertExchange` is idempotent - creates `devnexus_notifications` exchange if doesn't exist, or connects if it does
- Topic exchange allows routing by key (`notifications.message`)
- Persistent messages ensure delivery even if RabbitMQ restarts

#### 3.2: Update Processor to Use RabbitMQ

**Update `chatsetting.processor.ts` to inject RabbitMQ service:**
```typescript
import { RabbitMQService } from '../rabbit-mq/rabbitmq.service';

constructor(
  private readonly prismaService: PrismaService,
  private readonly logger: Logger,
  private readonly rabbitMQService: RabbitMQService,
) {
  super();
}
```

**Update `sendMessageNotification` method to publish:**
```typescript
// Replace the comment section with:
await this.rabbitMQService.publish(
  'devnexus_notifications',
  'notifications.message',
  notificationEvent
);

this.logger.log(`MESSAGE_REQUEST notification published for chat ${chatId}, recipients: ${requestRecipients.length}`);
```

#### 3.3: Register RabbitMQ Module (if not already registered)

Ensure `RabbitMQModule` is imported in `chatsetting.module.ts`:
```typescript
import { RabbitMQModule } from '../rabbit-mq/rabbitmq.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'chatsetting',
    }),
    RabbitMQModule, // Ensure this is imported
  ],
  // ... rest of module config
})
```

### Step 4: Update Notification Service (if needed)

The notification-service already handles:
- Grouping by GroupKey ✅
- AggregatedCount increment ✅
- Message generation via convertTypeToMessage ✅ (updated to support aggregation)
- Real-time emission via WebSocket ✅

**Recent Updates**:
- ✅ `convertTypeToMessage` now includes `AggregatedCount` in type signature
- ✅ All notification messages support "and X others" aggregation format
- ✅ Frontend notification-item.tsx updated to display backend-generated messages directly
- ✅ MESSAGE entity type (value 6) already exists in both backend and frontend enums

**No additional changes needed** - the notification service is ready to handle MESSAGE_REQUEST notifications with proper aggregation.

---

## Testing Scenarios

### Message Request Grouping (Multiple Senders):
1. ✅ User A sends message request to User C
   - Notification created: "User A sent you a message request"
   - AggregatedCount = 1
   - ActionUrl points to User A's chat

2. ✅ User B sends message request to User C
   - **Same notification updated** (not new)
   - ActorId changes to User B
   - AggregatedCount = 2
   - Display: "**User B** sent you a message request **and 1 other**"
   - ActionUrl points to User B's chat (latest)

3. ✅ User D sends message request to User C
   - **Same notification updated** again
   - ActorId changes to User D
   - AggregatedCount = 3
   - Display: "**User D** sent you a message request **and 2 others**"
   - ActionUrl points to User D's chat (latest)

4. ✅ User C clicks notification
   - Taken to User D's chat (latest sender)
   - Can navigate to "Requests" tab to see all requests

### Multiple Messages from Same Sender:
1. ✅ User A sends 3 messages to User C (before acceptance)
   - Only ONE notification (first message triggers it)
   - Subsequent messages from User A don't increment AggregatedCount
   - AggregatedCount only increments when **different users** send requests

### Accepting Requests:
1. ✅ User C accepts User A's request
   - User A's chat: IsRequested → false
   - Future messages from User A don't trigger notifications
   - Notification still shows other pending requests (User B, User D)

2. ✅ User C accepts all requests
   - All chats: IsRequested → false
   - Notification can be marked as read/deleted
   - New requests from new users create fresh notification

### Mute Settings:
1. ✅ User C mutes User A's request
   - User A sends more messages
   - User C gets NO notifications from User A
   - Other requests (User B, User D) still update the notification

### Regular Messages (No Notifications):
1. ✅ User A sends message in accepted chat (IsRequested: false)
   - NO notification sent
   - Message appears immediately via WebSocket
   - This is intentional - regular messages don't need notifications

---

## GroupKey Format

For message request notifications (ALL requests grouped together):
```
${recipientId}:MESSAGE:message_requests:MESSAGE_REQUEST
```

**Examples**:
- `user123:MESSAGE:message_requests:MESSAGE_REQUEST`

**Grouping Behavior**:
- **All message requests to the same recipient use the SAME GroupKey**
- EntityId is static string `"message_requests"` (not ChatId)
- Different senders update the same notification
- AggregatedCount = number of different people who sent requests
- ActorId always shows the latest sender
- ActionUrl always points to the latest sender's chat

---

## Configuration

### Bull Queue Options:
```typescript
{
  attempts: 3,           // Retry 3 times on failure
  backoff: {
    type: 'exponential',
    delay: 2000,         // Start with 2s delay, exponential backoff
  },
  removeOnComplete: true, // Clean up completed jobs
  removeOnFail: false,    // Keep failed jobs for debugging
}
```

### Notification Window:
- Existing notifications checked within **24 hours** (same as other notifications)
- After 24h or if read, new notification created

---

## Database Schema (Verify)

### ChatSetting:
- `IsMuted: boolean` ✅ (already exists)
- `IsRequested: boolean` ✅ (already exists)

### Notification (notification-service):
- `GroupKey: string` ✅
- `AggregatedCount: number` ✅
- `EntityType: enum` (verify MESSAGE exists)
- `Type: enum` (MESSAGE_REQUEST)

---

## Routing Keys

- **Vote notifications**: `notifications.vote`
- **Answer notifications**: `notifications.answer`
- **Comment notifications**: `notifications.comment`
- **Message notifications**: `notifications.message` ← **New**

All route to same exchange: `devnexus_notifications` (topic exchange)

---

## Performance Considerations

1. **Background Processing**: Bull queue ensures message sending isn't blocked by notification processing
2. **Batch Processing**: Multiple recipients processed in parallel
3. **Mute Check**: Single query to filter muted recipients
4. **Grouping**: Reduces notification spam by updating existing notifications

---

## Error Handling

1. **Bull Retry**: 3 attempts with exponential backoff
2. **Logging**: All errors logged with context (chatId, senderId)
3. **Graceful Degradation**: If notification fails, message still sent successfully
4. **Dead Letter Queue**: Failed jobs after 3 attempts moved to failed queue for manual review

---

## Future Enhancements

1. **Smart Notification Clearing**: Auto-clear notification when user accepts the request
2. **Notification Throttling**: Limit notifications per chat request per hour
3. **Push Notifications**: Integrate with FCM/APNS for mobile push
4. **Email Notifications**: Send email for unread message requests after X hours
5. **Batch Requests**: Show "You have 5 new message requests" summary notification

---

## Summary

This implementation:
- ✅ Uses Bull queue for background processing (like mute settings)
- ✅ Sends MESSAGE_REQUEST only (not regular messages)
- ✅ **Groups ALL message requests together** (not per chat)
- ✅ Shows latest sender + count: "User B and 2 others sent you a message request"
- ✅ ActionUrl points to latest sender's chat
- ✅ AggregatedCount = number of different people who sent requests
- ✅ Regular messages use real-time WebSocket only (no notifications needed)
- ✅ Respects ChatSettings.IsMuted
- ✅ Only notifies recipients who have IsRequested: true
- ✅ Follows existing notification patterns (vote, comment, answer)
- ✅ Uses existing message mapping in convertTypeToMessage
- ✅ Uses static EntityId "message_requests" to group all requests together
