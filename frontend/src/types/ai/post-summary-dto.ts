export type SummaryLanguage = 'auto' | 'vi' | 'en';

export interface SummarizePostRequestDTO {
  /** Omit to let the backend default to 'auto' (ai-worker detects from post content). */
  language?: SummaryLanguage;
}

export interface SummarizePostResponseDTO {
  postId: string;
  summaryPoints: string[];
  originalEstimatedReadTimeSeconds: number;
  summaryEstimatedReadTimeSeconds: number;
  cached: boolean;
}
