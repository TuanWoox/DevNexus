from pydantic import BaseModel, Field


class MetadataRequest(BaseModel):
    markdown_content: str = Field(..., min_length=20, description="Raw Markdown content of the post")


class MetadataResponse(BaseModel):
    suggested_title: str = Field(..., description="AI-suggested title for the post")
    suggested_tags: list[str] = Field(..., description="AI-suggested list of relevant tags")


class SummarizeRequest(BaseModel):
    content: str = Field(..., min_length=50, description="Full post content to summarize")
    language: str = Field(default="vi", description="Target language for the summary (e.g. 'vi', 'en')")


class SummarizeResponse(BaseModel):
    summary_points: list[str] = Field(..., description="3-5 key bullet-point takeaways")
    estimated_read_time_seconds: int = Field(..., description="Estimated read time of the original content in seconds")
