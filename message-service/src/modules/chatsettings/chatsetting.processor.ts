import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { PrismaService } from "../prisma-database/prisma.service";
import { Logger } from "@nestjs/common";
import { RabbitMQService } from '../rabbit-mq/rabbitmq.service';
import { PublishMessageBusDTO } from "src/shared/dtos/helper/PublishMessageBusDTO";
import { NotiicationCreatedEntity } from "src/shared/dtos/helper/NotificationEventDTO";
import { ActorType, EntityTypeEnum, NotificationEventEnum } from "src/utils/enums/NotificationEventEnum";
import { MessageBusEntityEnum, MessageBusEnum } from "src/utils/enums/MessageBusEnum";

interface UnmuteData {
    chatSettingId: string
}

interface SendMessageNotificationData {
    chatId: string;
    senderId: string;
    messageContent: string;
}

@Processor('chatsetting')
export class ChatSettingProcessor extends WorkerHost {

    constructor(
        private readonly prismaService: PrismaService,
        private readonly logger: Logger,
        private readonly rabbitMQService: RabbitMQService
    ) {
        super();

    }

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

    private async unMuteChatSetting(data: UnmuteData) {
        try {
            await this.prismaService.chatSetting.update({
                where: {
                    Id: data.chatSettingId,
                },
                data: {
                    MuteUntil: null,
                    IsMuted: false,
                }
            })
        }
        catch (ex) {
            this.logger.log(ex)
        }
    }

    private async sendMessageNotification(data: SendMessageNotificationData) {
        try {
            const { chatId, senderId, messageContent } = data;

            const sender = await this.prismaService.profile.findFirst({
                where: { Id: senderId },
                select: { FullName: true, AvatarUrl: true },
            });

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

            // Get recipients who have this as a request (IsRequested: true)
            const requestRecipients = chat.ChatSettings
                .filter(cs => !cs.IsMuted) // Also filter out muted
                .map(cs => cs.ProfileId);

            if (requestRecipients.length === 0) {
                this.logger.log(`No request recipients for chat ${chatId}`);
                return;
            }

            // Publish notification event to RabbitMQ
            // IMPORTANT: EntityId is intentionally static ("message_requests")
            // so ALL message request notifications are grouped together.
            const publishMessage: PublishMessageBusDTO<NotiicationCreatedEntity> = {
                Entity: {
                    EventType: NotificationEventEnum.MESSAGE_REQUEST,
                    ActorType: ActorType.PROFILE,
                    ActorId: senderId,
                    ActorName: sender?.FullName ?? undefined,
                    ActorAvatarUrl: sender?.AvatarUrl ?? undefined,
                    // Multiple recipients can receive the same notification
                    RecipientId: requestRecipients,
                    EntityType: EntityTypeEnum.MESSAGE,
                    // Static ID used to group all message request notifications
                    EntityId: 'message_requests',
                    // Notification title shown to recipients
                    EntityTitle: 'New Message Request',
                    // Short preview of the message content (max 100 chars)
                    EntityPreview: messageContent?.substring(0, 100),
                    // Redirect URL to open the related chat
                    // Format: /messages/{chatId}
                    ActionUrl: `/messages/${chatId}?tab=request`,
                    // ISO timestamp for notification creation time
                    Timestamp: new Date().toISOString(),
                },
                // Publish "Create" event to message bus
                MessageBusEnum: MessageBusEnum.Create,
                // Notification entity channel/topic
                MessageBusEntityEnum: MessageBusEntityEnum.Notification,
            };

            await this.rabbitMQService.publish(
                'devnexus_notifications',
                'notifications.message',
                publishMessage
            );

            this.logger.log(`MESSAGE_REQUEST notification published for chat ${chatId}, recipients: ${requestRecipients.length}`);
        }
        catch (ex) {
            this.logger.error('Error sending message notification:', ex);
            throw ex; // Re-throw to trigger Bull retry
        }
    }
}
