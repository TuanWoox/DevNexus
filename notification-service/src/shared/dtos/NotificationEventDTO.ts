import { NotificationEventEnum, EntityTypeEnum } from '../enums/NotificationEventEnum';

export interface NotificationEventDTO {
  EventType: NotificationEventEnum;
  ActorId: string;
  ActorName: string;
  ActorAvatarUrl: string;
  RecipientId: string | string[];
  EntityType: EntityTypeEnum;
  EntityId: string;
  EntityTitle?: string;
  EntityPreview?: string;
  ActionUrl: string;
  Timestamp: string;
}
