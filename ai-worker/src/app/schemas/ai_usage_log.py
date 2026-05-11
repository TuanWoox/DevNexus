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


# --- Phase 7: AI Usage Summary Schemas ---

class AiUsageByModelDTO(BaseModel):
    model: str = Field(..., description="Gemini model string")
    call_count: int = Field(..., description="Number of AI calls for this model")
    input_tokens: int = Field(..., description="Sum of input tokens for this model")
    output_tokens: int = Field(..., description="Sum of output tokens for this model")
    total_tokens: int = Field(..., description="Sum of total tokens for this model")


class AiUsageByFeatureDTO(BaseModel):
    feature: str = Field(..., description="Logical feature name")
    call_count: int = Field(..., description="Number of AI calls for this feature")
    input_tokens: int = Field(..., description="Sum of input tokens for this feature")
    output_tokens: int = Field(..., description="Sum of output tokens for this feature")
    total_tokens: int = Field(..., description="Sum of total tokens for this feature")


class AiUsageByDateDTO(BaseModel):
    date: str = Field(..., description="Calendar date in YYYY-MM-DD format")
    call_count: int = Field(..., description="Number of AI calls on this date")
    input_tokens: int = Field(..., description="Sum of input tokens on this date")
    output_tokens: int = Field(..., description="Sum of output tokens on this date")
    total_tokens: int = Field(..., description="Sum of total tokens on this date")


class AiUsageSummaryResponse(BaseModel):
    total_calls: int = Field(..., description="Grand total number of AI calls in the date range")
    total_input_tokens: int = Field(..., description="Grand total input tokens in the date range")
    total_output_tokens: int = Field(..., description="Grand total output tokens in the date range")
    total_tokens: int = Field(..., description="Grand total tokens in the date range")
    by_model: list[AiUsageByModelDTO] = Field(default_factory=list, description="Breakdown by model")
    by_feature: list[AiUsageByFeatureDTO] = Field(default_factory=list, description="Breakdown by feature")
    by_date: list[AiUsageByDateDTO] = Field(default_factory=list, description="Daily breakdown, sorted ascending")
