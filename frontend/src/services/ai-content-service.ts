import api from "@/lib/axiosConfig";
import { ReturnResult } from "@/types/common/return-result";
import {
    MetadataSuggestionRequestDTO,
    MetadataSuggestionResponseDTO,
    UpdateAiUsageInteractionRequestDTO,
} from "@/types/ai/content-metadata-dto";

type MetadataSuggestionApiResponse =
    | MetadataSuggestionResponseDTO
    | ReturnResult<MetadataSuggestionResponseDTO>;

function normalizeMetadataSuggestionResponse(
    payload: MetadataSuggestionApiResponse
): MetadataSuggestionResponseDTO {
    if ("result" in payload) {
        return payload.result;
    }

    return payload;
}

export const aiContentService = {
    suggestMetadata: async (
        payload: MetadataSuggestionRequestDTO
    ): Promise<MetadataSuggestionResponseDTO> => {
        const { data } = await api.post<MetadataSuggestionApiResponse>('/AiContent/metadata', payload);
        return normalizeMetadataSuggestionResponse(data);
    },
    updateUsageInteraction: async (
        usageLogId: number,
        payload: UpdateAiUsageInteractionRequestDTO
    ): Promise<boolean> => {
        const { data } = await api.patch<ReturnResult<boolean>>(
            `/AiUsageInteractions/${usageLogId}/interaction`,
            payload,
            { suppressToast: true }
        );

        return data.result;
    },
};
