import { Injectable, Scope, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma-database/prisma.service';
import { PagedData } from '../../shared/dtos/PagedData';
import { Page } from '../../shared/dtos/Page';
import { Notification } from '../../generated/prisma/client';
import { NotiicationCreatedEntity } from '../../shared/dtos/NotificationEventDTO';
import { ReturnResult } from '../../shared/dtos/ReturnResult';
import { UserContextService } from '../auth/userContext.service';
import { NotificationGateway } from '../websocket/notification.gateway';
import { PublishMessageBusDTO } from 'src/shared/dtos/helper/PublishMessageBusDTO';
import { MessageBusEnum } from 'src/utils/enums/MessageBusEnum';
import { convertTypeToMessage } from 'src/utils/helper/convertTypeToMessage';

@Injectable({ scope: Scope.REQUEST })
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly userContext: UserContextService,
    private readonly notificationGateway: NotificationGateway,
  ) { }

  async getNotifications(
    page: Page<string>,
  ): Promise<ReturnResult<PagedData<string, any>>> {
    const returnResult = new ReturnResult<PagedData<string, any>>();
    const profileId = this.userContext.getProfileId();

    if (page.size > 50) page.size = 50;

    const where: any = { RecipientId: profileId };
    if (page.selected?.includes('unread')) {
      where.IsRead = false;
    }

    const skip = (page.pageNumber - 1) * page.size;

    const [data, totalElements] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { DateCreated: 'desc' },
        skip,
        take: page.size,
        include: {
          Actor: {
            select: {
              Id: true,
              FullName: true,
              AvatarUrl: true,
            },
          },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    const enriched = data.map((n) => ({
      ...n,
      Message: n.ActorId ? convertTypeToMessage(n, n.Actor?.FullName ?? 'Someone') : n.Message,
    }));

    returnResult.Result = {
      page: { ...page, totalElements },
      data: enriched,
    };

    return returnResult;
  }


  async getUnreadCount(): Promise<ReturnResult<number>> {
    const returnResult = new ReturnResult<number>();
    const profileId = this.userContext.getProfileId();

    returnResult.Result = await this.prisma.notification.count({
      where: { RecipientId: profileId, IsRead: false },
    });
    return returnResult;
  }

  async markAsRead(notificationId: string): Promise<ReturnResult<boolean>> {
    const returnResult = new ReturnResult<boolean>();
    const profileId = this.userContext.getProfileId();

    await this.prisma.notification.updateMany({
      where: { Id: notificationId, RecipientId: profileId },
      data: { IsRead: true, ReadAt: new Date() },
    });
    returnResult.Result = true;
    return returnResult;
  }

  async markAllAsRead(): Promise<ReturnResult<number>> {
    const returnResult = new ReturnResult<number>();
    const profileId = this.userContext.getProfileId();

    const result = await this.prisma.notification.updateMany({
      where: { RecipientId: profileId, IsRead: false },
      data: { IsRead: true, ReadAt: new Date() },
    });
    returnResult.Result = result.count;
    return returnResult;
  }

  async deleteNotification(notificationId: string): Promise<ReturnResult<boolean>> {
    const returnResult = new ReturnResult<boolean>();
    const profileId = this.userContext.getProfileId();

    await this.prisma.notification.deleteMany({
      where: { Id: notificationId, RecipientId: profileId },
    });
    returnResult.Result = true;
    return returnResult;
  }

  async createFromEvent(publishMessage: PublishMessageBusDTO<NotiicationCreatedEntity>) {

    if (publishMessage.MessageBusEnum != MessageBusEnum.Create) return;
    const event = publishMessage.Entity;
    if (!event) return;

    const recipientIds = Array.isArray(event.RecipientId)
      ? event.RecipientId
      : [event.RecipientId];

    // FIX 1 & 2: Batch-fetch all settings up front with Promise.all
    // instead of sequential per-recipient DB calls inside the loop
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

    // Index lookups for O(1) access
    const globalSettingMap = new Map(globalSettings.map((s) => [s.ProfileId, s]));
    const mutedSet = new Set(muteSettings.map((m) => m.ProfileId));
    const existingMap = new Map(
      existingNotifications
        .filter((n): n is typeof n & { GroupKey: string } => n.GroupKey !== null)
        .map((n) => [n.GroupKey, n]),
    );

    // FIX 5: Process each recipient independently with error isolation
    const createdResults = await Promise.allSettled(
      recipientIds.map((recipientId) =>
        this.processRecipient(recipientId, event, globalSettingMap, mutedSet, existingMap),
      ),
    );

    // Collect successful notifications with their recipientId
    const created: Array<{ recipientId: string; notification: any }> = [];
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

    // FIX 4: Batch unread counts in one query instead of N separate DB calls
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

    // Emit real-time events using the loop variable recipientId (FIX 1)
    for (const { recipientId, notification } of created) {
      this.notificationGateway.emitToUser(recipientId, 'notification:new', notification);
      this.notificationGateway.emitToUser(
        recipientId,
        'notification:unread-count',
        unreadCountMap.get(recipientId) ?? 0,
      );
    }
  }

  // FIX 3: Extracted to a transaction to eliminate the race condition
  private async processRecipient(
    recipientId: string,
    event: NotiicationCreatedEntity,
    globalSettingMap: Map<string, any>,
    mutedSet: Set<string>,
    existingMap: Map<string, any>,
  ) {
    // Check global kill switch
    const globalSetting = globalSettingMap.get(recipientId);
    if (globalSetting && !globalSetting.AllNotifications) return null;

    // Check per-entity mute
    if (mutedSet.has(recipientId)) return null;

    const groupKey = `${recipientId}:${event.EntityType}:${event.EntityId}:${event.EventType}`;
    const existing = existingMap.get(groupKey);

    // FIX 3: Wrap upsert-like logic in a transaction to prevent race conditions
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
          // Ensure Message is always a string (Prisma model expects non-nullable string)
          Message: event.ActorId ? "" : event.Message ?? "",
          ActionUrl: event.ActionUrl,
          GroupKey: groupKey,
        },
      });
    });
  }

  async getUnreadCountForUser(profileId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { RecipientId: profileId, IsRead: false },
    });
  }
}