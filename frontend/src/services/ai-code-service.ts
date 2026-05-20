import api from "@/lib/axiosConfig";
import { AxiosError, isAxiosError } from "axios";
import { ReturnResult } from "@/types/common/return-result";
import {
    ExplainCodeRequestDTO,
    ExplainCodeResponseDTO,
    GenerateCodeDiagramRequestDTO,
    GenerateCodeDiagramResponseDTO,
} from "@/types/ai/code-tools-dto";

type RawExplainCodeResponseDTO = ExplainCodeResponseDTO & {
    purpose?: string;
    howItWorks?: string[];
    how_it_works?: string[];
    importantDetails?: string[];
    important_details?: string[];
    potentialIssues?: string[];
    potential_issues?: string[];
    suggestedImprovements?: string[];
    suggested_improvements?: string[];
    concepts?: string[];
    complexityRating?: string;
    complexity_rating?: string;
    key_flow?: string[];
    watch_out?: string[];
    generated_at?: string | null;
    details?: {
        importantDetails?: string[];
        important_details?: string[];
        suggestedImprovements?: string[];
        suggested_improvements?: string[];
        concepts?: string[];
        complexityRating?: string;
        complexity_rating?: string;
    };
};

type RawGenerateCodeDiagramResponseDTO = GenerateCodeDiagramResponseDTO & {
    mermaid_syntax?: string;
    diagram_type?: "flowchart" | "sequence";
    generated_at?: string | null;
};

type ExplainCodeApiRequestDTO = {
    code: string;
    language?: string;
    post_id?: string;
};

type GenerateCodeDiagramApiRequestDTO = {
    code: string;
    language?: string;
    diagram_type: GenerateCodeDiagramRequestDTO["diagramType"];
    post_id?: string;
    force_regenerate?: boolean;
};

function normalizeExplainResponse(payload: RawExplainCodeResponseDTO): ExplainCodeResponseDTO {
    const details = payload.details ?? {};
    const summary = payload.summary ?? payload.purpose ?? "";

    return {
        summary,
        keyFlow: payload.keyFlow ?? payload.key_flow ?? payload.howItWorks ?? payload.how_it_works ?? [],
        watchOut: payload.watchOut ?? payload.watch_out ?? payload.potentialIssues ?? payload.potential_issues ?? [],
        details: {
            importantDetails:
                details.importantDetails ??
                details.important_details ??
                payload.importantDetails ??
                payload.important_details ??
                [],
            suggestedImprovements:
                details.suggestedImprovements ??
                details.suggested_improvements ??
                payload.suggestedImprovements ??
                payload.suggested_improvements ??
                [],
            concepts: details.concepts ?? payload.concepts ?? [],
            complexityRating:
                details.complexityRating ??
                details.complexity_rating ??
                payload.complexityRating ??
                payload.complexity_rating,
        },
        status: payload.status,
        message: payload.message ?? null,
        cached: payload.cached,
        generatedAt: payload.generatedAt ?? payload.generated_at ?? null,
    };
}

function normalizeDiagramResponse(
    payload: RawGenerateCodeDiagramResponseDTO
): GenerateCodeDiagramResponseDTO {
    return {
        mermaidCode: payload.mermaidCode ?? payload.mermaid_syntax ?? "",
        diagramType: payload.diagramType ?? payload.diagram_type ?? "flowchart",
        status: payload.status,
        message: payload.message ?? null,
        cached: payload.cached,
        generatedAt: payload.generatedAt ?? payload.generated_at ?? null,
    };
}

export function getAiCodeErrorMessage(error: unknown): string {
    if (isAxiosError(error)) {
        const axiosError = error as AxiosError<ReturnResult<unknown>>;
        if (axiosError.response?.status === 429) {
            return "You have reached the AI usage limit. Please try again later.";
        }

        if (axiosError.response?.status === 408 || axiosError.code === "ECONNABORTED") {
            return "AI generation timed out. Please try again shortly.";
        }

        if (axiosError.response?.data?.message) {
            return axiosError.response.data.message;
        }
    }

    return "Could not generate AI result. Please try again.";
}

function toExplainApiPayload(payload: ExplainCodeRequestDTO): ExplainCodeApiRequestDTO {
    return {
        code: payload.code,
        language: payload.language,
        post_id: payload.postId,
    };
}

function toDiagramApiPayload(payload: GenerateCodeDiagramRequestDTO): GenerateCodeDiagramApiRequestDTO {
    return {
        code: payload.code,
        language: payload.language,
        diagram_type: payload.diagramType,
        post_id: payload.postId,
        force_regenerate: payload.forceRegenerate,
    };
}

export const aiCodeService = {
    explainCode: async (payload: ExplainCodeRequestDTO): Promise<ExplainCodeResponseDTO> => {
        const { data } = await api.post<ReturnResult<RawExplainCodeResponseDTO>>(
            "/AiContent/code/explain",
            toExplainApiPayload(payload),
            { suppressToast: true }
        );

        return normalizeExplainResponse(data.result);
    },

    generateCodeDiagram: async (
        payload: GenerateCodeDiagramRequestDTO
    ): Promise<GenerateCodeDiagramResponseDTO> => {
        const { data } = await api.post<ReturnResult<RawGenerateCodeDiagramResponseDTO>>(
            "/AiContent/code/diagram",
            toDiagramApiPayload(payload),
            { suppressToast: true }
        );

        return normalizeDiagramResponse(data.result);
    },
};
