from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class AiUsageLogDTO(BaseModel):
    id: int = Field(..., description="Auto-increment primary key")
    feature_name: str = Field(..., description="Logical feature that triggered the Gemini call")
    model_used: str = Field(..., description="Gemini model string used for the call")
    input_tokens: int = Field(..., description="Prompt token count from usage_metadata")
    output_tokens: int = Field(..., description="Completion token count from usage_metadata")
    total_tokens: int = Field(..., description="Derived sum of input + output tokens")
    user_id: Optional[str] = Field(default=None, description="Originating user ID; None for system calls")
    created_at: datetime = Field(..., description="UTC timestamp set automatically by the database")

    model_config = {"from_attributes": True}


class AiUsageLogPageResponse(BaseModel):
    data: list[AiUsageLogDTO] = Field(..., description="Page of AI usage log entries")
    total: int = Field(..., description="Total matching rows across all pages")
    page: int = Field(..., description="Current 1-based page number")
    page_size: int = Field(..., description="Number of items in this page")
