// When we use the general route => only to update these field
export interface UpdateChatSettingDTO {
    Id: string
    MuteUntil: Date | null
    IsMuted: boolean | null
    IsPinned: boolean | null
    IsArchived: boolean | null
    IsRequested: boolean | null
}

export interface UpdateNickName {
    Id: string,
    NickName: string | null,
    ProfileIdToUpdate: string
}