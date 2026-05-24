export interface MuteStatusDTO {
    isMuted: boolean;
    muteId?: string | null;
    mutedUntil?: string | null;
    muteReason?: string | null;
}
