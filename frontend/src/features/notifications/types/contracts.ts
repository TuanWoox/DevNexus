import { ActorType } from "./enums";

export interface Notification {
    Id: string;
    RecipientId: string;
    Type: number;
    ActorType: ActorType;
    ActorId?: string;
    ActorName?: string;
    ActorAvatarUrl?: string;
    EntityType?: number;
    EntityId?: string;
    EntityTitle?: string;
    EntityPreview?: string;
    Message: string;
    ActionUrl?: string;
    IsRead: boolean;
    ReadAt?: string;
    GroupKey?: string;
    AggregatedCount: number;
    IsMuted?: boolean;
    DateCreated: string;
    DateModified: string;
}
