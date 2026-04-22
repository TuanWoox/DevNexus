from typing import Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Code Explainer
# ---------------------------------------------------------------------------

class CodeExplainRequest(BaseModel):
    code: str = Field(..., min_length=1, description="The code block to explain.")
    language: str = Field(..., min_length=1, description="Programming language (e.g., python, javascript).")


class CodeExplainResponse(BaseModel):
    explanation: str = Field(..., description="Step-by-step natural language explanation.")
    concepts: list[str] = Field(..., description="List of key programming concepts used (e.g., 'for loop', 'recursion').")
    complexity_rating: int = Field(..., ge=1, le=10, description="Estimated complexity from 1 to 10.")


# ---------------------------------------------------------------------------
# Code-to-Diagram
# ---------------------------------------------------------------------------

class DiagramRequest(BaseModel):
    code: str = Field(..., min_length=1, description="The code block to generate a diagram for.")
    diagram_type: Literal["flowchart", "sequence"] = Field("flowchart", description="Type of Mermaid diagram to generate.")


class DiagramResponse(BaseModel):
    mermaid_syntax: str = Field(..., description="Valid Mermaid.js syntax without markdown fences.")
    diagram_type: str = Field(..., description="The type of diagram generated.")


# ---------------------------------------------------------------------------
# First-Responder
# ---------------------------------------------------------------------------

class FirstResponderRequest(BaseModel):
    stacktrace: str = Field(..., min_length=1, description="The error stack trace to analyze.")
    language: str = Field(..., min_length=1, description="Programming language context.")


class FirstResponderResponse(BaseModel):
    root_cause: str = Field(..., description="One sentence root cause analysis.")
    suggested_fixes: list[str] = Field(..., max_length=3, description="Up to 3 actionable steps to fix.")
    related_docs: list[str] = Field(default_factory=list, description="URLs to relevant official documentation.")
