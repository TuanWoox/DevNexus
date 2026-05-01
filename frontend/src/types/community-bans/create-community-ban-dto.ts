export interface CreateCommunityBanDTO {
    communityId: string,
    bannedProfileId: string,
    banReason?: string,
}