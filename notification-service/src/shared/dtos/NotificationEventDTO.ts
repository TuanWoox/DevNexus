import { ActorType, NotificationEventEnum, EntityTypeEnum } from '../enums/NotificationEventEnum';

export interface NotiicationCreatedEntity {
  EventType: NotificationEventEnum;
  ActorType?: ActorType;
  ActorId: string;
  ActorName?: string;
  ActorAvatarUrl?: string;
  RecipientId: string | string[];
  EntityType: EntityTypeEnum;
  EntityId: string;
  EntityTitle?: string;
  EntityPreview?: string;
  ActionUrl: string;
  Timestamp: string;
  Message?: string;
}
