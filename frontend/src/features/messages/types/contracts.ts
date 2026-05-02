import { Page } from "@/types/common/page";

export type InboxTab = "main" | "request" | "archived";

export interface PagedData<TKey, TEntity> {
    page: Page<TKey>;
    data: TEntity[];
}

export type ChatRole = "ADMIN" | "MEMBER";

export interface ProfileSummary {
    Id?: string;
    FullName: string;
    AvatarUrl: string | null;
}

export interface ChatMember {
    Id: string;
    ChatId: string;
    MemberId: string;
    Member: ProfileSummary;
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

export interface Chat {
    Id: string;
    Name: string | null;
    IsGroup: boolean;
    ChatPictureUrl: string | null;
    DateCreated: string;
    DateModified: string;
    Members: ChatMember[];
    ChatSettings?: ChatSetting[];
    Messages?: Message[];
}

export interface Message {
    Id: number;
    Content: string;
    SenderId: string;
    ChatId: string;
    DateCreated: string;
    DateModified: string;
    Sender: ProfileSummary
    ReadReceipts: ReadReceipt[]
    Chat: Chat
    Medias: Media[]
}

export interface Media {
    Id: string;
    MediaName: string;
    Type: MediaType;

    MessageId: number;
    Message: Message; // make sure you define this type elsewhere

    DateCreated?: Date | null;
    DateModified?: Date | null;

    Deleted: boolean;
    DateDeleted?: Date | null;
}

export enum MediaType {
    Video = "Video",
    Image = "Image",
    File = "File",
}
export interface ReadReceipt {
    MessageId: number;
    ReaderId: string;
    ReadAt: string;
    Reader?: ProfileSummary;
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

export interface UpdateNickName {
    Id: string;
    NickName: string | null;
    ProfileIdToUpdate: string;
}

// Group chat types
export interface GroupMember {
    ProfileId: string;
    FullName: string;
    AvatarUrl: string | null;
    Role: ChatRole;
    NickName: string | null;
}

export interface UpdateGroupDto {
    Name?: string;
}

export interface AddMembersDto {
    profileIds: string[];
}

export interface UpdateRoleDto {
    Role: ChatRole;
}

export interface TransferOwnershipDto {
    newOwnerProfileId: string;
}