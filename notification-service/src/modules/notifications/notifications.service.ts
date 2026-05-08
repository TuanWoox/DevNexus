import { Injectable, Scope } from '@nestjs/common';
import { PrismaService } from '../prisma-database/prisma.service';
import { PagedData } from '../../shared/dtos/PagedData';
import { Page } from '../../shared/dtos/Page';
import { NotificationType, EntityType, Notification } from '../../generated/prisma/client';
import { NotificationEventDTO } from '../../shared/dtos/NotificationEventDTO';
import { ReturnResult } from '../../shared/dtos/ReturnResult';
import { UserContextService } from '../auth/userContext.service';

@Injectable({ scope: Scope.REQUEST })
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userContext: UserContextService,
  ) {}

  async getNotifications(page: Page<string>): Promise<ReturnResult<PagedData<string, Notification>>> {
    const returnResult = new ReturnResult<PagedData<string, Notification>>();
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
      }),
      this.prisma.notification.count({ where }),
    ]);

    returnResult.Result = {
      page: { ...page, totalElements },
      data,
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

  async createFromEvent(event: NotificationEventDTO): Promise<any[]> {
    const recipientIds = Array.isArray(event.RecipientId)
      ? event.RecipientId
      : [event.RecipientId];

    const created: any[] = [];

    for (const recipientId of recipientIds) {
      // Check global kill switch
      const globalSetting = await this.prisma.notificationGlobalSetting.findUnique({
        where: { ProfileId: recipientId },
      });
      if (globalSetting && !globalSetting.AllNotifications) continue;

      // Check per-entity mute
      const muted = await this.prisma.notificationMuteSetting.findUnique({
        where: {
          ProfileId_EntityType_EntityId_Type: {
            ProfileId: recipientId,
            EntityType: event.EntityType as EntityType,
            EntityId: event.EntityId,
            Type: event.EventType as NotificationType,
          },
        },
      });
      if (muted) continue;

      // Check existing group within 24h to aggregate
      const groupKey = `${recipientId}:${event.EntityType}:${event.EntityId}:${event.EventType}`;
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const existing = await this.prisma.notification.findFirst({
        where: { GroupKey: groupKey, DateCreated: { gte: since } },
        orderBy: { DateCreated: 'desc' },
      });

      if (existing) {
        const updated = await this.prisma.notification.update({
          where: { Id: existing.Id },
          data: {
            ActorId: event.ActorId,
            AggregatedCount: { increment: 1 },
            IsRead: false,
            ReadAt: null,
            DateModified: new Date(),
          },
        });
        created.push(updated);
      } else {
        const notification = await this.prisma.notification.create({
          data: {
            RecipientId: recipientId,
            Type: event.EventType as NotificationType,
            ActorId: event.ActorId,
            EntityType: event.EntityType as EntityType,
            EntityId: event.EntityId,
            EntityTitle: event.EntityTitle,
            EntityPreview: event.EntityPreview,
            Message: this.buildMessage(event),
            ActionUrl: event.ActionUrl,
            GroupKey: groupKey,
          },
        });
        created.push(notification);
      }
    }

    return created;
  }

  async getUnreadCountForUser(profileId: string): Promise<number> {
    return await this.prisma.notification.count({
      where: { RecipientId: profileId, IsRead: false },
    });
  }

  private buildMessage(event: NotificationEventDTO): string {
    const actor = event.ActorName;
    const title = event.EntityTitle ? `"${event.EntityTitle}"` : 'your content';

    const messages: Record<string, string> = {
      UPVOTE_POST: `${actor} upvoted your post ${title}`,
      DOWNVOTE_POST: `${actor} downvoted your post ${title}`,
      UPVOTE_ANSWER: `${actor} upvoted your answer`,
      DOWNVOTE_ANSWER: `${actor} downvoted your answer`,
      UPVOTE_COMMENT: `${actor} upvoted your comment`,
      DOWNVOTE_COMMENT: `${actor} downvoted your comment`,
      NEW_ANSWER: `${actor} answered your question ${title}`,
      COMMENT_POST: `${actor} commented on your post ${title}`,
      COMMENT_ANSWER: `${actor} commented on your answer`,
      REPLY_COMMENT: `${actor} replied to your comment`,
      ANSWER_ACCEPTED: `Your answer was accepted`,
      FOLLOW_USER: `${actor} started following you`,
      FOLLOW_REQUEST: `${actor} sent you a follow request`,
      FOLLOW_ACCEPTED: `${actor} accepted your follow request`,
      COMMUNITY_INVITE: `${actor} invited you to a community`,
      COMMUNITY_JOIN_REQUEST: `${actor} requested to join your community`,
      COMMUNITY_POST: `New post in your community`,
      COMMUNITY_ROLE_CHANGE: `Your role in the community has changed`,
      COMMUNITY_BAN: `You have been banned from a community`,
      NEW_MESSAGE: `${actor} sent you a message`,
      MESSAGE_REQUEST: `${actor} sent you a message request`,
      MODERATION_RESULT: `Your post has been reviewed`,
      REPUTATION_MILESTONE: `You reached a new reputation milestone`,
      SYSTEM_ANNOUNCEMENT: `New system announcement`,
    };

    return messages[event.EventType] ?? `New notification from ${actor}`;
  }
}
