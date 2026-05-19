export type CodeToolContext = "post-detail" | "post-preview" | "reply" | "message" | "admin";

export type DiagramType = "auto" | "flowchart" | "sequence";
export type GeneratedDiagramType = Exclude<DiagramType, "auto">;

export interface ExplainCodeRequestDTO {
    code: string;
    language?: string;
    postId?: string;
}

export interface ExplainCodeResponseDTO {
    purpose: string;
    howItWorks: string[];
    importantDetails: string[];
    potentialIssues: string[];
    suggestedImprovements: string[];
    concepts?: string[];
    complexityRating?: string;
}

export interface GenerateCodeDiagramRequestDTO {
    code: string;
    language?: string;
    diagramType: DiagramType;
    postId?: string;
}

export interface GenerateCodeDiagramResponseDTO {
    mermaidCode: string;
    diagramType: GeneratedDiagramType;
}
