import { useMutation } from "@tanstack/react-query";
import { aiCodeService } from "@/services/ai-code-service";
import { ExplainCodeRequestDTO } from "@/types/ai/code-tools-dto";

export const useExplainCode = () => {
    return useMutation({
        mutationFn: (payload: ExplainCodeRequestDTO) => aiCodeService.explainCode(payload),
    });
};
