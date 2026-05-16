export type SummaryLanguage = 'auto' | 'vi' | 'en';
export type PostSummaryStatus = 'Completed' | 'Generating' | 'Failed';

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
  status: PostSummaryStatus;
  message?: string;
  generatedAt?: string;
}
