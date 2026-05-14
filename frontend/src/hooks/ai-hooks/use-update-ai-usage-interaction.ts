import { useMutation } from "@tanstack/react-query";
import { aiContentService } from "@/services/ai-content-service";
import { UpdateAiUsageInteractionRequestDTO } from "@/types/ai/content-metadata-dto";

interface UpdateAiUsageInteractionMutationPayload {
    usageLogId: number;
    payload: UpdateAiUsageInteractionRequestDTO;
}

export const useUpdateAiUsageInteraction = () => {
    return useMutation({
        mutationFn: ({ usageLogId, payload }: UpdateAiUsageInteractionMutationPayload) =>
            aiContentService.updateUsageInteraction(usageLogId, payload),
    });
};
