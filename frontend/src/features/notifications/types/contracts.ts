export interface Notification {
    Id: string;
    RecipientId: string;
    Type: number;
    ActorId?: string;
    Actor: Actor
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


export interface Actor {
    FullName: string,
    AvatarUrl?: string,
}
