import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { PrismaService } from "../prisma-database/prisma.service";
import { Logger } from "@nestjs/common";
import { RabbitMQService } from '../rabbit-mq/rabbitmq.service';

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
                ActionUrl: `/messages?chatId=${chatId}`, // Format: /messages?chatId={chatId}
                Timestamp: new Date(),
            };
            
            await this.rabbitMQService.publish(
                'devnexus_notifications',
                'notifications.message',
                notificationEvent
            );
            
            this.logger.log(`MESSAGE_REQUEST notification published for chat ${chatId}, recipients: ${requestRecipients.length}`);
        }
        catch (ex) {
            this.logger.error('Error sending message notification:', ex);
            throw ex; // Re-throw to trigger Bull retry
        }
    }
}