export interface AiUsageLogDTO {
  id: number;
  feature_name: string;
  model_used: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  user_id?: string;
  created_at: string;
}

export interface AiUsageByModelDTO {
  model: string;
  call_count: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
}

export interface AiUsageByFeatureDTO {
  feature: string;
  call_count: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
}

export interface AiUsageByDateDTO {
  date: string;
  call_count: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
}

export interface AdminAiUsageSummaryDTO {
  total_calls: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  by_model: AiUsageByModelDTO[];
  by_feature: AiUsageByFeatureDTO[];
  by_date: AiUsageByDateDTO[];
}
