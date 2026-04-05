export interface UpdateChatSettingDTO {
    Id: string
    NickName: string | null
    MuteUntil: Date | null
    IsMuted: boolean | null
    IsPinned: boolean | null
    IsArchived: boolean | null
    IsRequested: boolean | null
}