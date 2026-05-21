export type CodeToolContext = "post-detail" | "post-preview" | "reply" | "message" | "admin";

export type DiagramType = "auto" | "flowchart" | "sequence";
export type GeneratedDiagramType = Exclude<DiagramType, "auto">;
export type CodeToolStatus = "Completed" | "Generating" | "Failed";

export interface ExplainCodeRequestDTO {
    code: string;
    language?: string;
    postId?: string;
}

export interface ExplainCodeDetailsDTO {
    importantDetails: string[];
    suggestedImprovements: string[];
    concepts: string[];
    complexityRating?: string;
}

export interface ExplainCodeResponseDTO {
    summary: string;
    keyFlow: string[];
    watchOut: string[];
    details: ExplainCodeDetailsDTO;
    status?: CodeToolStatus;
    message?: string | null;
    cached?: boolean;
    generatedAt?: string | null;
}

export interface GenerateCodeDiagramRequestDTO {
    code: string;
    language?: string;
    diagramType: DiagramType;
    postId?: string;
    forceRegenerate?: boolean;
}

export interface GenerateCodeDiagramResponseDTO {
    mermaidCode: string;
    diagramType: GeneratedDiagramType;
    status?: CodeToolStatus;
    message?: string | null;
    cached?: boolean;
    generatedAt?: string | null;
}
