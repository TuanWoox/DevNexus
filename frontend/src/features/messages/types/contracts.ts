export interface ReturnResult<T> {
    Message?: string;
    Result: T | null;
}

export interface Page<T> {
    size: number;
    pageNumber: number;
    totalElements: number;
    selected: T[];
    indexPaging: T | null;
}

export interface PagedData<TKey, TEntity> {
    page: Page<TKey>;
    data: TEntity[];
}

export type ChatRole = "ADMIN" | "MEMBER";

export interface ProfileSummary {
    Id: string;
    FullName: string;
    AvatarUrl: string | null;
}

export interface Chat {
    Id: string;
    Name: string | null;
    IsGroup: boolean;
    ChatPictureUrl: string | null;
    DateCreated: string;
    DateModified: string;
}

export interface ChatSetting {
    Id: string;
    NickName: string | null;
    MuteUntil: string | null;
    IsMuted: boolean;
    IsPinned: boolean;
    IsArchived: boolean;
    IsRequested: boolean;
    Role: ChatRole;
    DeleteUpToMessageId: number | null;
    ProfileId: string;
    ChatId: string;
    DateCreated: string;
    DateModified: string;
}

export interface Message {
    Id: number;
    Content: string;
    SenderId: string;
    ChatId: string;
    DateCreated: string;
    DateModified: string;
}

export interface MessageReadReceipt {
    MessageId: number;
    ReaderId: string;
    ReadAt: string;
}

export interface CreateMessageDto {
    ChatId: string;
    Content: string;
}

export interface UpdateChatSettingDTO {
    Id: string;
    MuteUntil: string | null;
    IsMuted: boolean | null;
    IsPinned: boolean | null;
    IsArchived: boolean | null;
    IsRequested: boolean | null;
}

export interface MessageReadEvent {
    messageId: number;
    readerId: string;
    chatId: string;
}

export interface ChatListItem {
    Chat: Chat;
    CurrentSetting: ChatSetting;
    Participants: ProfileSummary[];
    LastMessage: Message | null;
    LastMessageSender: ProfileSummary | null;
    UnreadCount: number;
}

export interface ChatDetailData {
    Chat: Chat;
    CurrentSetting: ChatSetting;
    Participants: ProfileSummary[];
    Messages: Message[];
    Receipts: MessageReadReceipt[];
}
