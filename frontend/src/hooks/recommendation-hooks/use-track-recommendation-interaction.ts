import { useMutation } from "@tanstack/react-query";
import { recommendationService } from "@/services/recommendation-service";
import { RecommendationInteractionDTO } from "@/types/recommendation/recommendation-dtos";

export function useTrackRecommendationInteraction() {
    return useMutation({
        mutationFn: (payload: RecommendationInteractionDTO) =>
            recommendationService.trackInteraction(payload),
    });
}
