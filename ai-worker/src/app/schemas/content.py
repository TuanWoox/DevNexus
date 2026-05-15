from typing import Literal

from pydantic import BaseModel, Field


class MetadataRequest(BaseModel):
    markdown_content: str = Field(..., min_length=20, description="Raw Markdown content of the post")


class MetadataResponse(BaseModel):
    suggested_title: str = Field(..., description="AI-suggested title for the post")
    suggested_tags: list[str] = Field(..., description="AI-suggested list of relevant tags")
    usage_log_id: int | None = Field(default=None, description="AI usage log ID for later interaction tracking")


class SummarizeRequest(BaseModel):
    content: str = Field(..., min_length=50, description="Full post content to summarize")
    language: Literal["auto", "vi", "en"] = Field(
        default="auto",
        description=(
            "Target language for the summary. "
            "'auto' = detect from post content; 'vi' = Vietnamese; 'en' = English."
        ),
    )


class SummarizeResponse(BaseModel):
    summary_points: list[str] = Field(..., description="3-5 neutral bullet-point summary of the post")
    estimated_read_time_seconds: int = Field(..., description="Estimated read time of the original content in seconds")

