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
    postId: str = Field(..., alias="PostId", description="Post ID")
    title: str = Field(..., alias="Title", description="Post title")
    content: str = Field(..., alias="Content", description="Post content")
    tags: list[str] = Field(default_factory=list, alias="Tags", description="Post tags")
    authorId: str = Field(..., alias="AuthorId", description="Author ID")
    authorDisplayName: str = Field(..., alias="AuthorDisplayName", description="Author display name")
    createdAt: str = Field(..., alias="CreatedAt", description="Post creation date")


class FirstResponderResponse(BaseModel):
    success: bool = Field(..., alias="success", description="Whether the comment generation was successful")
    generatedComment: str | None = Field(None, alias="generatedComment", description="The AI generated friendly first comment")
    errorMessage: str | None = Field(None, alias="errorMessage", description="Error message if generation failed")
