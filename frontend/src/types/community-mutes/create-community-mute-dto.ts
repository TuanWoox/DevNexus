export interface CreateCommunityMuteDTO {
    communityId: string;
    mutedProfileId: string;
    mutedUntil?: string; // DateTimeOffset as ISO string
    muteReason?: string;
}
