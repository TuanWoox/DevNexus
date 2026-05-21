import { Injectable, Scope, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma-database/prisma.service';
import { PagedData } from '../../shared/dtos/PagedData';
import { Page } from '../../shared/dtos/Page';
import { ReturnResult } from '../../shared/dtos/ReturnResult';
import { UserContextService } from '../auth/userContext.service';
import { NotificationGateway } from '../websocket/notification.gateway';
import { convertTypeToMessage } from 'src/utils/helper/convertTypeToMessage';

@Injectable({ scope: Scope.REQUEST })
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly userContext: UserContextService,
    private readonly notificationGateway: NotificationGateway,
  ) { }

  async getNotifications(page: Page<string>): Promise<ReturnResult<PagedData<string, any>>> {
    const returnResult = new ReturnResult<PagedData<string, any>>();
    const profileId = this.userContext.getProfileId();

    if (page.size > 50) page.size = 50;
    const skip = (page.pageNumber - 1) * page.size;

    const where = {
      RecipientId: profileId,
      ...(page.selected?.includes('unread') ? { IsRead: false } : {}),
    };

    // Run both queries in parallel
    const [notifications, totalElements] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: page.size,
        orderBy: { DateCreated: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    // Batch-fetch mute settings for the returned notifications in one query
    const entityPairs = notifications
      .filter((n) => n.EntityType != null && n.EntityId != null)
      .map((n) => ({ EntityType: n.EntityType!, EntityId: n.EntityId!, Type: n.Type }));

    const muteSettings = entityPairs.length > 0
      ? await this.prisma.notificationMuteSetting.findMany({
        where: {
          ProfileId: profileId,
          OR: entityPairs.map((p) => ({
            EntityType: p.EntityType,
            EntityId: p.EntityId,
            Type: p.Type,
          })),
        },
        select: { EntityType: true, EntityId: true, Type: true },
      })
      : [];

    // O(1) lookup set
    const muteSet = new Set(
      muteSettings.map((m) => `${m.EntityType}:${m.EntityId}:${m.Type}`)
    );

    const enriched = notifications.map((n) => ({
      ...n,
      Message: n.ActorId
        ? convertTypeToMessage(n, n.ActorName ?? 'Someone')
        : n.Message,
      IsMuted: n.EntityType != null && n.EntityId != null
        ? muteSet.has(`${n.EntityType}:${n.EntityId}:${n.Type}`)
        : false,
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

  async getUnreadCountForUser(profileId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { RecipientId: profileId, IsRead: false },
    });
  }
}
