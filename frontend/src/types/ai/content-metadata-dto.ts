export interface MetadataSuggestionRequestDTO {
    markdown_content: string;
}

export interface MetadataSuggestionResponseDTO {
    suggested_title: string;
    suggested_tags: string[];
    usage_log_id?: number | null;
}

export type AiUsageInteractionStatus = 'applied' | 'dismissed';

export interface UpdateAiUsageInteractionRequestDTO {
    interaction_status: AiUsageInteractionStatus;
    metadata_json_patch?: Record<string, boolean | number | string | null>;
}
