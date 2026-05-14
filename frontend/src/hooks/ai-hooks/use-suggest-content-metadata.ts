import { useMutation } from "@tanstack/react-query";
import { aiContentService } from "@/services/ai-content-service";
import { MetadataSuggestionRequestDTO } from "@/types/ai/content-metadata-dto";

export const useSuggestContentMetadata = () => {
    return useMutation({
        mutationFn: (payload: MetadataSuggestionRequestDTO) => aiContentService.suggestMetadata(payload),
    });
};
