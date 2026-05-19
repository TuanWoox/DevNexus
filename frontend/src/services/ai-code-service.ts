import api from "@/lib/axiosConfig";
import { ReturnResult } from "@/types/common/return-result";
import {
    ExplainCodeRequestDTO,
    ExplainCodeResponseDTO,
    GenerateCodeDiagramRequestDTO,
    GenerateCodeDiagramResponseDTO,
} from "@/types/ai/code-tools-dto";

type RawExplainCodeResponseDTO = ExplainCodeResponseDTO & {
    how_it_works?: string[];
    important_details?: string[];
    potential_issues?: string[];
    suggested_improvements?: string[];
    complexity_rating?: string;
};

type RawGenerateCodeDiagramResponseDTO = GenerateCodeDiagramResponseDTO & {
    mermaid_syntax?: string;
    diagram_type?: "flowchart" | "sequence";
};

function normalizeExplainResponse(payload: RawExplainCodeResponseDTO): ExplainCodeResponseDTO {
    return {
        purpose: payload.purpose,
        howItWorks: payload.howItWorks ?? payload.how_it_works ?? [],
        importantDetails: payload.importantDetails ?? payload.important_details ?? [],
        potentialIssues: payload.potentialIssues ?? payload.potential_issues ?? [],
        suggestedImprovements: payload.suggestedImprovements ?? payload.suggested_improvements ?? [],
        concepts: payload.concepts ?? [],
        complexityRating: payload.complexityRating ?? payload.complexity_rating,
    };
}

function normalizeDiagramResponse(
    payload: RawGenerateCodeDiagramResponseDTO
): GenerateCodeDiagramResponseDTO {
    return {
        mermaidCode: payload.mermaidCode ?? payload.mermaid_syntax ?? "",
        diagramType: payload.diagramType ?? payload.diagram_type ?? "flowchart",
    };
}

export const aiCodeService = {
    explainCode: async (payload: ExplainCodeRequestDTO): Promise<ExplainCodeResponseDTO> => {
        const { data } = await api.post<ReturnResult<RawExplainCodeResponseDTO>>(
            "/AiContent/code/explain",
            payload,
            { suppressToast: true }
        );

        return normalizeExplainResponse(data.result);
    },

    generateCodeDiagram: async (
        payload: GenerateCodeDiagramRequestDTO
    ): Promise<GenerateCodeDiagramResponseDTO> => {
        const { data } = await api.post<ReturnResult<RawGenerateCodeDiagramResponseDTO>>(
            "/AiContent/code/diagram",
            payload,
            { suppressToast: true }
        );

        return normalizeDiagramResponse(data.result);
    },
};
