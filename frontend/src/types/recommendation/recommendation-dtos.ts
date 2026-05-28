export interface RecommendationInteractionDTO {
    postId?: string | null;
    qaPostId?: string | null;
    interactionType: 'view' | 'dwell' | 'click' | 'share';
    dwellTimeSeconds?: number | null;
    source?: 'feed' | 'search' | 'recommendation' | 'direct' | string | null;
}

export interface RecommendationFeedbackDTO {
    postId?: string | null;
    qaPostId?: string | null;
    communityId?: string | null;
    feedbackType: 'not_interested' | 'hide' | 'report_irrelevant' | string;
}
