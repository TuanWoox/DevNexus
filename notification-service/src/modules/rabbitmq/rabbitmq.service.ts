import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp, { Channel, ConsumeMessage } from 'amqplib';
import { NotiicationCreatedEntity } from '../../shared/dtos/NotificationEventDTO';
import { ProfileSyncService } from '../profile-sync/profile-sync.service';
import { PublishMessageBusDTO } from '../../shared/dtos/helper/PublishMessageBusDTO';
import { MessageBusEntityEnum } from '../../utils/enums/MessageBusEnum';
import { PrismaService } from '../prisma-database/prisma.service';
import { NotificationGateway } from '../websocket/notification.gateway';
import { MessageBusEnum } from 'src/utils/enums/MessageBusEnum';
import { convertTypeToMessage } from 'src/utils/helper/convertTypeToMessage';
import type { Notification } from '../../generated/prisma/client';

type NotificationWithActor = Notification & {
  Actor: { Id: string; FullName: string | null; AvatarUrl: string | null } | null;
};

@Injectable()
export class RabbitMQService implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQService.name);
  private channel!: Channel;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
    private readonly profileSyncService: ProfileSyncService,
  ) {
    this.logger.log('RabbitMQService constructor called');
  }

  async onModuleInit() {
    const rabbitUrl = this.configService.get<string>('RABBITMQ_URL') ?? 'amqp://localhost';
    this.logger.log(`Attempting to connect to RabbitMQ at: ${rabbitUrl}`);

    let connection: Awaited<ReturnType<typeof amqp.connect>> | undefined;
    let retries = 10;
    while (retries) {
      try {
        connection = await amqp.connect(rabbitUrl);
        this.logger.log('Successfully connected to RabbitMQ');
        break;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`RabbitMQ connection failed: ${errorMessage}`);
        this.logger.error(`Retrying in 5s... (${retries} attempts left)`);
        retries -= 1;
        await new Promise((res) => setTimeout(res, 5000));
      }
    }

    if (!connection) throw new Error('Could not connect to RabbitMQ after 10 retries');

    this.channel = await connection.createChannel();
    this.logger.log('RabbitMQ channel created');

    await this.subscribeToNotifications();
    await this.subscribeToSync();

    this.logger.log('RabbitMQ consumers ready');
  }

  private async subscribeToNotifications() {
    const exchange = 'devnexus_notifications';

    // change fanout → topic
    await this.channel.assertExchange(exchange, 'topic', { durable: true });

    const { queue } = await this.channel.assertQueue('notification_service_queue', { durable: true });

    const routingKey = 'notifications.*'; // adjust as needed

    await this.channel.bindQueue(queue, exchange, routingKey);

    await this.channel.consume(queue, (msg) => {
      void this.onConsumeNotification(msg);
    });

    this.logger.log(`Subscribed to ${exchange} with key ${routingKey}`);
  }

  private async subscribeToSync() {
    const exchange = 'devnexus_sync';
    await this.channel.assertExchange(exchange, 'fanout', { durable: true });

    // Using a named, durable queue to prevent data loss on service restart
    const { queue } = await this.channel.assertQueue('notification_service_sync_queue', { durable: true });
    await this.channel.bindQueue(queue, exchange, '');

    await this.channel.consume(queue, (msg) => {
      void this.onConsumeSync(msg);
    });

    this.logger.log('Subscribed to devnexus_sync');
  }

  private async onConsumeNotification(msg: ConsumeMessage | null) {
    if (!msg) return;

    try {
      const data = JSON.parse(msg.content.toString()) as PublishMessageBusDTO<NotiicationCreatedEntity>;
      switch (data.MessageBusEntityEnum) {
        case MessageBusEntityEnum.Notification:
          await this.createNotificationFromEvent(data);
          break;
        default:
          this.logger.log(`[Notification] Unhandled entity: ${data.MessageBusEntityEnum}`);
      }

      this.channel.ack(msg);
    } catch (error) {
      this.logger.error('Error processing notification event:', error);
      this.channel.nack(msg, false, false);
    }
  }

  private async createNotificationFromEvent(publishMessage: PublishMessageBusDTO<NotiicationCreatedEntity>) {
    if (publishMessage.MessageBusEnum != MessageBusEnum.Create) return;
    const event = publishMessage.Entity;
    if (!event) return;

    const recipientIds = Array.isArray(event.RecipientId)
      ? event.RecipientId
      : [event.RecipientId];

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [globalSettings, muteSettings, existingNotifications] = await Promise.all([
      this.prisma.notificationGlobalSetting.findMany({
        where: { ProfileId: { in: recipientIds } },
      }),
      this.prisma.notificationMuteSetting.findMany({
        where: {
          ProfileId: { in: recipientIds },
          EntityType: event.EntityType,
          EntityId: event.EntityId,
          Type: event.EventType,
        },
      }),
      this.prisma.notification.findMany({
        where: {
          GroupKey: {
            in: recipientIds.map(
              (id) => `${id}:${event.EntityType}:${event.EntityId}:${event.EventType}`,
            ),
          },
          DateCreated: { gte: since },
        },
        orderBy: { DateCreated: 'desc' },
      }),
    ]);

    const globalSettingMap = new Map(globalSettings.map((s) => [s.ProfileId, s]));
    const mutedSet = new Set(muteSettings.map((m) => m.ProfileId));
    const existingMap = new Map(
      existingNotifications
        .filter((n): n is typeof n & { GroupKey: string } => n.GroupKey !== null)
        .map((n) => [n.GroupKey, n]),
    );

    const createdResults = await Promise.allSettled(
      recipientIds.map((recipientId) =>
        this.processRecipient(recipientId, event, globalSettingMap, mutedSet, existingMap),
      ),
    );

    const created: Array<{ recipientId: string; notification: NotificationWithActor }> = [];
    for (let i = 0; i < createdResults.length; i++) {
      const result = createdResults[i];
      if (result.status === 'fulfilled' && result.value) {
        created.push({ recipientId: recipientIds[i], notification: result.value });
      } else if (result.status === 'rejected') {
        this.logger.error(
          `Failed to create notification for recipient ${recipientIds[i]}: ${result.reason}`,
        );
      }
    }

    if (created.length === 0) return;

    const unreadCounts = await this.prisma.notification.groupBy({
      by: ['RecipientId'],
      where: {
        RecipientId: { in: created.map((c) => c.recipientId) },
        IsRead: false,
      },
      _count: { Id: true },
    });

    const unreadCountMap = new Map(
      unreadCounts.map((r) => [r.RecipientId, r._count.Id]),
    );

    // Emit notifications with Message enriched for real-time payloads
    for (const { recipientId, notification } of created) {
      const actorName = notification.Actor?.FullName ?? 'Someone';
      const enrichedNotification = notification.ActorId
        ? { ...notification, Message: convertTypeToMessage(notification, actorName) }
        : notification;

      this.notificationGateway.emitToUser(recipientId, 'notification:new', enrichedNotification);
      this.notificationGateway.emitToUser(
        recipientId,
        'notification:unread-count',
        unreadCountMap.get(recipientId) ?? 0,
      );
    }
  }

  private async processRecipient(
    recipientId: string,
    event: NotiicationCreatedEntity,
    globalSettingMap: Map<string, any>,
    mutedSet: Set<string>,
    existingMap: Map<string, any>,
  ) {
    const globalSetting = globalSettingMap.get(recipientId);
    if (globalSetting && !globalSetting.AllNotifications) return null;

    if (mutedSet.has(recipientId)) return null;

    const groupKey = `${recipientId}:${event.EntityType}:${event.EntityId}:${event.EventType}`;
    const existing = existingMap.get(groupKey);

    return this.prisma.$transaction(async (tx) => {
      if (existing) {
        return tx.notification.update({
          where: { Id: existing.Id },
          data: {
            ActorId: event.ActorId,
            AggregatedCount: { increment: 1 },
            IsRead: false,
            ReadAt: null,
            DateModified: new Date(),
          },
          include: {
            Actor: {
              select: {
                Id: true,
                FullName: true,
                AvatarUrl: true,
              },
            },
          },
        });
      }

      return tx.notification.create({
        data: {
          RecipientId: recipientId,
          Type: event.EventType,
          ActorId: event.ActorId,
          EntityType: event.EntityType,
          EntityId: event.EntityId,
          EntityTitle: event.EntityTitle,
          EntityPreview: event.EntityPreview,
          Message: event.ActorId ? "" : event.Message ?? "",
          ActionUrl: event.ActionUrl,
          GroupKey: groupKey,
        },
        include: {
          Actor: {
            select: {
              Id: true,
              FullName: true,
              AvatarUrl: true,
            },
          },
        },
      });
    });
  }

  private async onConsumeSync(msg: ConsumeMessage | null) {
    if (!msg) return;

    try {
      const data = JSON.parse(msg.content.toString()) as PublishMessageBusDTO<any>;

      switch (data.MessageBusEntityEnum) {
        case MessageBusEntityEnum.Profile:
          await this.profileSyncService.eventDrive(data);
          break;
        default:
          this.logger.log(`[Sync] Unhandled entity: ${data.MessageBusEntityEnum}`);
      }

      this.channel.ack(msg);
    } catch (error) {
      this.logger.error('Error processing sync event:', error);
      this.channel.nack(msg, false, false);
    }
  }
}
