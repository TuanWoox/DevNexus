import { useMutation } from "@tanstack/react-query";
import { aiCodeService } from "@/services/ai-code-service";
import { GenerateCodeDiagramRequestDTO } from "@/types/ai/code-tools-dto";

export const useGenerateCodeDiagram = () => {
    return useMutation({
        mutationFn: (payload: GenerateCodeDiagramRequestDTO) => aiCodeService.generateCodeDiagram(payload),
    });
};
