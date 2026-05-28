import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recommendationService } from "@/services/recommendation-service";
import { RecommendationFeedbackDTO } from "@/types/recommendation/recommendation-dtos";
import { recommendationQueryKeys } from "./use-recommendation-query-keys";

export function useSubmitRecommendationFeedback() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: RecommendationFeedbackDTO) =>
            recommendationService.submitFeedback(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: recommendationQueryKeys.all });
        },
    });
}
