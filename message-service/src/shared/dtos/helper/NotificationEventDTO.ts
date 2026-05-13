import { EntityTypeEnum, NotificationEventEnum } from "src/utils/enums/NotificationEventEnum";

export interface NotiicationCreatedEntity {
  EventType: NotificationEventEnum;
  ActorId: string;
  RecipientId: string | string[];
  EntityType: EntityTypeEnum;
  EntityId: string;
  EntityTitle?: string;
  EntityPreview?: string;
  ActionUrl: string;
  Timestamp: string;
  Message?: string;
}
