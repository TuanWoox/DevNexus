export interface MuteStatusDTO {
    isMuted: boolean;
    mutedUntil?: string | null;
    muteReason?: string | null;
}
