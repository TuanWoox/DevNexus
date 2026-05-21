from typing import Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Code Explainer
# ---------------------------------------------------------------------------

class CodeExplainRequest(BaseModel):
    code: str = Field(..., min_length=1, description="The code block to explain.")
    language: str | None = Field("auto", min_length=1, description="Programming language (e.g., python, javascript).")
    post_id: str | None = Field(None, description="Optional source post id for request context.")


class CodeExplainDetails(BaseModel):
    important_details: list[str] = Field(default_factory=list, max_length=4)
    suggested_improvements: list[str] = Field(default_factory=list, max_length=3)
    concepts: list[str] = Field(default_factory=list, max_length=5)
    complexity_rating: Literal["Low", "Medium", "High"] = "Medium"


class CodeExplainResponse(BaseModel):
    summary: str = Field(..., description="1-2 short sentences explaining what the code does.")
    key_flow: list[str] = Field(default_factory=list, max_length=5)
    watch_out: list[str] = Field(default_factory=list, max_length=3)
    details: CodeExplainDetails = Field(default_factory=CodeExplainDetails)


# ---------------------------------------------------------------------------
# Code-to-Diagram
# ---------------------------------------------------------------------------

class DiagramRequest(BaseModel):
    code: str = Field(..., min_length=1, description="The code block to generate a diagram for.")
    language: str | None = Field("auto", min_length=1, description="Programming language, or auto.")
    diagram_type: Literal["auto", "flowchart", "sequence"] = Field("auto", description="Type of Mermaid diagram to generate.")
    post_id: str | None = Field(None, description="Optional source post id for request context.")


class DiagramResponse(BaseModel):
    mermaid_syntax: str = Field(..., description="Valid Mermaid.js syntax without markdown fences.")
    diagram_type: Literal["flowchart", "sequence"] = Field(..., description="The type of diagram generated.")


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
