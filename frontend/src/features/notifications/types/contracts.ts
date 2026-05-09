export interface Notification {
    Id: string;
    RecipientId: string;
    Type: string;
    ActorId?: string;
    Actor: Actor
    EntityType?: string;
    EntityId?: string;
    EntityTitle?: string;
    EntityPreview?: string;
    Message: string;
    ActionUrl?: string;
    IsRead: boolean;
    ReadAt?: string;
    GroupKey?: string;
    AggregatedCount: number;
    DateCreated: string;
    DateModified: string;
}


export interface Actor {
    FullName: string,
    AvatarUrl?: string,
}