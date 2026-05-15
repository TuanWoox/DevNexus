export interface SummarizePostRequestDTO {
  language?: 'vi' | 'en';
}

export interface SummarizePostResponseDTO {
  postId: string;
  summaryPoints: string[];
  originalEstimatedReadTimeSeconds: number;
  summaryEstimatedReadTimeSeconds: number;
  cached: boolean;
}
